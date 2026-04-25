import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];

// Contact request type (manual since types.ts hasn't regenerated yet)
export interface ContactRequest {
  id: string;
  event_id: string;
  sponsor_id: string;
  organizer_id: string;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
  return data;
}

export type MatchLevel = "high" | "medium" | "low";

export interface MatchBreakdownItem {
  label: string;
  /** @deprecated use `level`. Kept for backwards compatibility (true when level === "high"). */
  compatible: boolean;
  level: MatchLevel;
  reason: string;
}

function makeItem(label: string, level: MatchLevel, reason: string): MatchBreakdownItem {
  return { label, level, compatible: level === "high", reason };
}

/**
 * MatchCalculator — calcula la puntuación y el desglose de match
 * entre un evento y un sponsor. Implementado como clase con métodos
 * estáticos para cumplir el requisito de arquitectura OO.
 */
export class MatchCalculator {
  static calculateMatchScore(event: Event, sponsor: Profile): number {
  let score = 0;
  let weights = 0;

  // 1. Sector match (30 pts) — sponsor.preferred_sectors vs event.sector
  const preferredSectors = (sponsor as any).preferred_sectors as string[] | null;
  if (event.sector && preferredSectors && preferredSectors.length > 0) {
    const match = preferredSectors.some(
      (s) => s.toLowerCase() === event.sector!.toLowerCase()
    );
    score += (match ? 1 : 0) * 30;
    weights += 30;
  } else if (event.sector && sponsor.industry) {
    // Fallback to old industry match
    const match = event.sector.toLowerCase() === sponsor.industry.toLowerCase() ? 1 : 0;
    score += match * 30;
    weights += 30;
  }

  // 2. Event type match (25 pts) — sponsor.preferred_event_types vs event.type
  const preferredTypes = (sponsor as any).preferred_event_types as string[] | null;
  if (event.type && preferredTypes && preferredTypes.length > 0) {
    const match = preferredTypes.some(
      (t) =>
        t.toLowerCase() === event.type!.toLowerCase() ||
        event.type!.toLowerCase().includes(t.toLowerCase()) ||
        t.toLowerCase().includes(event.type!.toLowerCase())
    );
    score += (match ? 1 : 0.1) * 25;
    weights += 25;
  }

  // 3. Audience match (20 pts) — sponsor.preferred_audiences vs event.audience
  const preferredAudiences = (sponsor as any).preferred_audiences as string[] | null;
  if (event.audience && preferredAudiences && preferredAudiences.length > 0) {
    const match = preferredAudiences.some(
      (a) =>
        a.toLowerCase() === event.audience!.toLowerCase() ||
        event.audience!.toLowerCase().includes(a.toLowerCase()) ||
        a.toLowerCase().includes(event.audience!.toLowerCase())
    );
    score += (match ? 1 : 0.1) * 20;
    weights += 20;
  }

  // 4. Budget / sponsorship range overlap (25 pts)
  if (
    sponsor.budget_min != null &&
    sponsor.budget_max != null &&
    event.sponsorship_min != null &&
    event.sponsorship_max != null
  ) {
    const eventInsideSponsor =
      event.sponsorship_min >= sponsor.budget_min &&
      event.sponsorship_max <= sponsor.budget_max;
    let budgetScore: number;
    if (eventInsideSponsor) {
      // Sponsor budget fully covers the event range → 100%
      budgetScore = 1;
    } else {
      const budgetOverlap = Math.max(
        0,
        Math.min(sponsor.budget_max, event.sponsorship_max) -
          Math.max(sponsor.budget_min, event.sponsorship_min)
      );
      const maxRange = Math.max(
        event.sponsorship_max - event.sponsorship_min,
        sponsor.budget_max - sponsor.budget_min,
        1
      );
      budgetScore = Math.min(budgetOverlap / maxRange, 1);
    }
    score += budgetScore * 25;
    weights += 25;
  }

  }

  static getMatchBreakdown(event: Event, sponsor: Profile, perspective: "sponsor" | "organizer" = "sponsor"): MatchBreakdownItem[] {
  const items: MatchBreakdownItem[] = [];
  const isOrganizer = perspective === "organizer";

  // Classify single value vs list of preferences:
  //  - high: exact match
  //  - medium: partial match (substring in either direction)
  //  - low: no match at all
  const classifyList = (eventValue: string, list: string[]): { level: MatchLevel; matched: string[]; unmatched: string[] } => {
    const ev = eventValue.toLowerCase();
    const matched: string[] = [];
    const unmatched: string[] = [];
    let exact = false;
    for (const x of list) {
      const xl = x.toLowerCase();
      if (xl === ev) { exact = true; matched.push(x); }
      else if (ev.includes(xl) || xl.includes(ev)) matched.push(x);
      else unmatched.push(x);
    }
    if (exact) return { level: "high", matched, unmatched };
    if (matched.length > 0) return { level: "medium", matched, unmatched };
    return { level: "low", matched, unmatched };
  };

  // Sector
  const preferredSectors = (sponsor as any).preferred_sectors as string[] | null;
  if (preferredSectors && preferredSectors.length > 0 && event.sector) {
    const { level, unmatched } = classifyList(event.sector, preferredSectors);
    const reason = level === "high"
      ? (isOrganizer
          ? `Tu sector "${event.sector}" coincide con las preferencias del sponsor: ${preferredSectors.join(", ")}`
          : `El sector "${event.sector}" coincide con tus preferencias: ${preferredSectors.join(", ")}`)
      : level === "medium"
      ? (isOrganizer
          ? `Coincide parcialmente. Las preferencias del sponsor que no se cubren son: ${unmatched.join(", ") || "ninguna"}`
          : `Coincide parcialmente. Tus preferencias que no se cubren son: ${unmatched.join(", ") || "ninguna"}`)
      : (isOrganizer
          ? `El sector "${event.sector}" no está entre las preferencias del sponsor: ${preferredSectors.join(", ")}`
          : `El sector "${event.sector}" no está entre tus preferencias: ${preferredSectors.join(", ")}`);
    items.push(makeItem("Sector", level, reason));
  } else if (event.sector && sponsor.industry) {
    const evL = event.sector.toLowerCase();
    const inL = sponsor.industry.toLowerCase();
    const level: MatchLevel = evL === inL ? "high" : (evL.includes(inL) || inL.includes(evL)) ? "medium" : "low";
    const reason = level === "high"
      ? (isOrganizer ? `Tu sector "${event.sector}" coincide con la industria del sponsor "${sponsor.industry}"` : `Tu industria "${sponsor.industry}" coincide con el sector del evento`)
      : level === "medium"
      ? `Hay afinidad parcial entre el sector "${event.sector}" y la industria "${sponsor.industry}", pero no es exacta`
      : (isOrganizer ? `Tu sector "${event.sector}" no coincide con la industria del sponsor "${sponsor.industry}"` : `El sector "${event.sector}" no coincide con tu industria "${sponsor.industry}"`);
    items.push(makeItem("Sector", level, reason));
  } else {
    items.push(makeItem("Sector", "low", !event.sector
      ? "El evento no tiene sector definido"
      : isOrganizer
        ? "El sponsor no tiene sectores preferidos configurados"
        : "No tienes sectores preferidos configurados en tu perfil"));
  }

  // Event type
  const preferredTypes = (sponsor as any).preferred_event_types as string[] | null;
  if (preferredTypes && preferredTypes.length > 0 && event.type) {
    const { level, unmatched } = classifyList(event.type, preferredTypes);
    const reason = level === "high"
      ? (isOrganizer
          ? `Tu tipo "${event.type}" coincide con las preferencias del sponsor: ${preferredTypes.join(", ")}`
          : `El tipo "${event.type}" coincide con tus preferencias: ${preferredTypes.join(", ")}`)
      : level === "medium"
      ? (isOrganizer
          ? `Coincide parcialmente. Las preferencias del sponsor que no se cubren son: ${unmatched.join(", ") || "ninguna"}`
          : `Coincide parcialmente. Tus preferencias que no se cubren son: ${unmatched.join(", ") || "ninguna"}`)
      : (isOrganizer
          ? `El tipo "${event.type}" no está entre las preferencias del sponsor: ${preferredTypes.join(", ")}`
          : `El tipo "${event.type}" no está entre tus preferencias: ${preferredTypes.join(", ")}`);
    items.push(makeItem("Tipo de evento", level, reason));
  } else {
    items.push(makeItem("Tipo de evento", "low", !event.type
      ? "El evento no tiene tipo definido"
      : isOrganizer
        ? "El sponsor no tiene tipos de evento preferidos configurados"
        : "No tienes tipos de evento preferidos configurados"));
  }

  // Audience
  const preferredAudiences = (sponsor as any).preferred_audiences as string[] | null;
  if (preferredAudiences && preferredAudiences.length > 0 && event.audience) {
    const { level, unmatched } = classifyList(event.audience, preferredAudiences);
    const reason = level === "high"
      ? (isOrganizer
          ? `Tu audiencia "${event.audience}" encaja con las preferencias del sponsor: ${preferredAudiences.join(", ")}`
          : `La audiencia "${event.audience}" encaja con tus preferencias: ${preferredAudiences.join(", ")}`)
      : level === "medium"
      ? (isOrganizer
          ? `Coincide parcialmente. Las preferencias del sponsor que no se cubren son: ${unmatched.join(", ") || "ninguna"}`
          : `Coincide parcialmente. Tus preferencias que no se cubren son: ${unmatched.join(", ") || "ninguna"}`)
      : (isOrganizer
          ? `La audiencia "${event.audience}" no está entre las preferencias del sponsor: ${preferredAudiences.join(", ")}`
          : `La audiencia "${event.audience}" no está entre tus preferencias: ${preferredAudiences.join(", ")}`);
    items.push(makeItem("Audiencia", level, reason));
  } else {
    items.push(makeItem("Audiencia", "low", !event.audience
      ? "El evento no tiene audiencia definida"
      : isOrganizer
        ? "El sponsor no tiene audiencias preferidas configuradas"
        : "No tienes audiencias preferidas configuradas"));
  }

  // Budget:
  //  - high: el rango del evento está totalmente dentro del rango del sponsor (cubre toda la necesidad)
  //  - medium: solape parcial (especifica la parte fuera)
  //  - low: sin solape
  if (
    sponsor.budget_min != null && sponsor.budget_max != null &&
    event.sponsorship_min != null && event.sponsorship_max != null
  ) {
    const sMin = sponsor.budget_min, sMax = sponsor.budget_max;
    const eMin = event.sponsorship_min, eMax = event.sponsorship_max;
    const overlap = Math.max(0, Math.min(sMax, eMax) - Math.max(sMin, eMin));
    const eventInsideSponsor = eMin >= sMin && eMax <= sMax;
    const level: MatchLevel = overlap <= 0 ? "low" : eventInsideSponsor ? "high" : "medium";
    const sponsorRangeStr = `$${sMin.toLocaleString()} - $${sMax.toLocaleString()}`;
    const eventRangeStr = `$${eMin.toLocaleString()} - $${eMax.toLocaleString()}`;

    let outsideDetail = "";
    if (level === "medium") {
      const parts: string[] = [];
      if (eMin < sMin) parts.push(`la franja $${eMin.toLocaleString()} - $${Math.min(sMin, eMax).toLocaleString()} queda por debajo del presupuesto del sponsor`);
      if (eMax > sMax) parts.push(`la franja $${Math.max(sMax, eMin).toLocaleString()} - $${eMax.toLocaleString()} queda por encima del presupuesto del sponsor`);
      outsideDetail = parts.join("; ");
    }

    const reason = level === "high"
      ? (isOrganizer
          ? `Tu rango de patrocinio (${eventRangeStr}) está dentro del presupuesto del sponsor (${sponsorRangeStr})`
          : `El rango del evento (${eventRangeStr}) cabe dentro de tu presupuesto (${sponsorRangeStr})`)
      : level === "medium"
      ? (isOrganizer
          ? `Solapa parcialmente con el presupuesto del sponsor (${sponsorRangeStr}): ${outsideDetail}`
          : `Tu presupuesto (${sponsorRangeStr}) solapa parcialmente con el del evento (${eventRangeStr}): ${outsideDetail}`)
      : (isOrganizer
          ? `Tu rango (${eventRangeStr}) no se solapa con el presupuesto del sponsor (${sponsorRangeStr})`
          : `Tu presupuesto (${sponsorRangeStr}) no se solapa con el del evento (${eventRangeStr})`);
    items.push(makeItem("Presupuesto", level, reason));
  } else {
    items.push(makeItem("Presupuesto", "low", isOrganizer
      ? (event.sponsorship_min == null || event.sponsorship_max == null)
        ? "Tu evento no tiene rango de patrocinio definido"
        : "El sponsor no tiene rango de presupuesto configurado"
      : (sponsor.budget_min == null || sponsor.budget_max == null)
        ? "No tienes rango de presupuesto configurado en tu perfil"
        : "El evento no tiene rango de patrocinio definido"));
  }

  return items;
}

