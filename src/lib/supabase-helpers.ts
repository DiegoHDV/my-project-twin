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

export function calculateMatchScore(
  event: Event,
  sponsor: Profile
): number {
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
    const budgetScore = Math.min(budgetOverlap / maxRange, 1);
    score += budgetScore * 25;
    weights += 25;
  }

  return weights > 0 ? Math.round((score / weights) * 100) : 50;
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

export function getMatchBreakdown(event: Event, sponsor: Profile, perspective: "sponsor" | "organizer" = "sponsor"): MatchBreakdownItem[] {
  const items: MatchBreakdownItem[] = [];
  const isOrganizer = perspective === "organizer";

  // Helper for list-based matches (sector, type, audience): exact = high, partial substring = medium, none = low
  const classifyList = (eventValue: string, list: string[]): MatchLevel => {
    const ev = eventValue.toLowerCase();
    const exact = list.some(x => x.toLowerCase() === ev);
    if (exact) return "high";
    const partial = list.some(x => {
      const xl = x.toLowerCase();
      return ev.includes(xl) || xl.includes(ev);
    });
    return partial ? "medium" : "low";
  };

  // Sector
  const preferredSectors = (sponsor as any).preferred_sectors as string[] | null;
  if (preferredSectors && preferredSectors.length > 0 && event.sector) {
    const level = classifyList(event.sector, preferredSectors);
    const reasonHigh = isOrganizer
      ? `Tu evento es del sector "${event.sector}" y coincide con las preferencias del sponsor: ${preferredSectors.join(", ")}`
      : `El sector "${event.sector}" coincide con tus preferencias: ${preferredSectors.join(", ")}`;
    const reasonMid = isOrganizer
      ? `El sector "${event.sector}" tiene cierta afinidad con las preferencias del sponsor: ${preferredSectors.join(", ")}`
      : `El sector "${event.sector}" tiene cierta afinidad con tus preferencias: ${preferredSectors.join(", ")}`;
    const reasonLow = isOrganizer
      ? `Tu evento es del sector "${event.sector}" pero las preferencias del sponsor son: ${preferredSectors.join(", ")}`
      : `El sector del evento es "${event.sector}" pero tus preferencias son: ${preferredSectors.join(", ")}`;
    items.push(makeItem("Sector", level, level === "high" ? reasonHigh : level === "medium" ? reasonMid : reasonLow));
  } else if (event.sector && sponsor.industry) {
    const evL = event.sector.toLowerCase();
    const inL = sponsor.industry.toLowerCase();
    const level: MatchLevel = evL === inL ? "high" : (evL.includes(inL) || inL.includes(evL)) ? "medium" : "low";
    const reasonHigh = isOrganizer
      ? `Tu evento es del sector "${event.sector}" y coincide con la industria del sponsor "${sponsor.industry}"`
      : `Tu industria "${sponsor.industry}" coincide con el sector del evento`;
    const reasonMid = isOrganizer
      ? `El sector "${event.sector}" tiene cierta afinidad con la industria del sponsor "${sponsor.industry}"`
      : `Tu industria "${sponsor.industry}" tiene cierta afinidad con el sector "${event.sector}"`;
    const reasonLow = isOrganizer
      ? `Tu evento es del sector "${event.sector}" pero la industria del sponsor es "${sponsor.industry}"`
      : `El sector del evento es "${event.sector}" pero tu industria es "${sponsor.industry}"`;
    items.push(makeItem("Sector", level, level === "high" ? reasonHigh : level === "medium" ? reasonMid : reasonLow));
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
    const level = classifyList(event.type, preferredTypes);
    const reasonHigh = isOrganizer
      ? `Tu evento es de tipo "${event.type}" y coincide con las preferencias del sponsor: ${preferredTypes.join(", ")}`
      : `El tipo "${event.type}" coincide con tus preferencias: ${preferredTypes.join(", ")}`;
    const reasonMid = isOrganizer
      ? `El tipo "${event.type}" tiene cierta afinidad con las preferencias del sponsor: ${preferredTypes.join(", ")}`
      : `El tipo "${event.type}" tiene cierta afinidad con tus preferencias: ${preferredTypes.join(", ")}`;
    const reasonLow = isOrganizer
      ? `Tu evento es de tipo "${event.type}" pero las preferencias del sponsor son: ${preferredTypes.join(", ")}`
      : `El tipo del evento es "${event.type}" pero tus preferencias son: ${preferredTypes.join(", ")}`;
    items.push(makeItem("Tipo de evento", level, level === "high" ? reasonHigh : level === "medium" ? reasonMid : reasonLow));
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
    const level = classifyList(event.audience, preferredAudiences);
    const reasonHigh = isOrganizer
      ? `Tu evento tiene audiencia "${event.audience}" y encaja con las preferencias del sponsor: ${preferredAudiences.join(", ")}`
      : `La audiencia "${event.audience}" encaja con tus preferencias: ${preferredAudiences.join(", ")}`;
    const reasonMid = isOrganizer
      ? `La audiencia "${event.audience}" tiene cierta afinidad con las preferencias del sponsor: ${preferredAudiences.join(", ")}`
      : `La audiencia "${event.audience}" tiene cierta afinidad con tus preferencias: ${preferredAudiences.join(", ")}`;
    const reasonLow = isOrganizer
      ? `Tu evento tiene audiencia "${event.audience}" pero las preferencias del sponsor son: ${preferredAudiences.join(", ")}`
      : `La audiencia del evento es "${event.audience}" pero tus preferencias son: ${preferredAudiences.join(", ")}`;
    items.push(makeItem("Audiencia", level, level === "high" ? reasonHigh : level === "medium" ? reasonMid : reasonLow));
  } else {
    items.push(makeItem("Audiencia", "low", !event.audience
      ? "El evento no tiene audiencia definida"
      : isOrganizer
        ? "El sponsor no tiene audiencias preferidas configuradas"
        : "No tienes audiencias preferidas configuradas"));
  }

  // Budget: high = solape ≥ 50% del rango más pequeño, medium = solape > 0, low = sin solape
  if (
    sponsor.budget_min != null && sponsor.budget_max != null &&
    event.sponsorship_min != null && event.sponsorship_max != null
  ) {
    const overlap = Math.max(
      0,
      Math.min(sponsor.budget_max, event.sponsorship_max) -
        Math.max(sponsor.budget_min, event.sponsorship_min)
    );
    const sponsorRange = Math.max(1, sponsor.budget_max - sponsor.budget_min);
    const eventRange = Math.max(1, event.sponsorship_max - event.sponsorship_min);
    const smallerRange = Math.min(sponsorRange, eventRange);
    const ratio = overlap / smallerRange;
    const level: MatchLevel = overlap <= 0 ? "low" : ratio >= 0.5 ? "high" : "medium";
    const sponsorRangeStr = `$${sponsor.budget_min.toLocaleString()} - $${sponsor.budget_max.toLocaleString()}`;
    const eventRangeStr = `$${event.sponsorship_min.toLocaleString()} - $${event.sponsorship_max.toLocaleString()}`;
    const reasonHigh = isOrganizer
      ? `Tu rango de patrocinio (${eventRangeStr}) se solapa ampliamente con el presupuesto del sponsor (${sponsorRangeStr})`
      : `Tu rango (${sponsorRangeStr}) se solapa ampliamente con el del evento (${eventRangeStr})`;
    const reasonMid = isOrganizer
      ? `Tu rango de patrocinio (${eventRangeStr}) se solapa parcialmente con el presupuesto del sponsor (${sponsorRangeStr})`
      : `Tu rango (${sponsorRangeStr}) se solapa parcialmente con el del evento (${eventRangeStr})`;
    const reasonLow = isOrganizer
      ? `Tu rango de patrocinio (${eventRangeStr}) no se solapa con el presupuesto del sponsor (${sponsorRangeStr})`
      : `Tu rango (${sponsorRangeStr}) no se solapa con el del evento (${eventRangeStr})`;
    items.push(makeItem("Presupuesto", level, level === "high" ? reasonHigh : level === "medium" ? reasonMid : reasonLow));
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

