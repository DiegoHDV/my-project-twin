// Utilidad para calcular el "Alcance" de un evento respecto a la ubicación del sponsor.
// Formato esperado de location (texto libre): "Ciudad, Región, País" o "Ciudad, País".
// La comparación es tolerante: case-insensitive y por tokens separados por coma.

export type Reach = "Local" | "Regional" | "Nacional" | "Internacional";

const norm = (s: string) => s.trim().toLowerCase();

function parseLocation(loc: string | null | undefined): { city?: string; region?: string; country?: string } {
  if (!loc) return {};
  const parts = loc.split(",").map((p) => norm(p)).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { city: parts[0] };
  if (parts.length === 2) return { city: parts[0], country: parts[1] };
  // 3+ → city, region, country (resto se ignora)
  return { city: parts[0], region: parts[1], country: parts[2] };
}

/**
 * Calcula el alcance de un evento dado el sponsor que lo visualiza.
 * Devuelve null si falta la ubicación de alguno de los dos.
 */
export function computeReach(eventLocation: string | null | undefined, sponsorLocation: string | null | undefined): Reach | null {
  if (!eventLocation || !sponsorLocation) return null;
  const e = parseLocation(eventLocation);
  const s = parseLocation(sponsorLocation);

  if (e.city && s.city && e.city === s.city) return "Local";
  if (e.region && s.region && e.region === s.region) return "Regional";
  if (e.country && s.country) {
    return e.country === s.country ? "Nacional" : "Internacional";
  }
  // Fallback: si solo hay city de un lado y city del otro y no coinciden → asumimos Internacional desconocido → Nacional como suposición segura
  // Pero sin país no podemos asegurarlo: devolvemos null para no etiquetar mal
  return null;
}

export const REACH_OPTIONS: Reach[] = ["Local", "Regional", "Nacional", "Internacional"];

export const REACH_BADGE_CLASSES: Record<Reach, string> = {
  Local: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  Regional: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  Nacional: "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400",
  Internacional: "bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
};
