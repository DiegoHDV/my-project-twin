import type { Event, Profile } from "@/lib/supabase-helpers";
import { calculateMatchScore, getMatchBreakdown } from "@/lib/supabase-helpers";

/**
 * Builds a warm, direct auto-generated intro message for a new conversation
 * between a sponsor and an organizer, based on the event and match breakdown.
 *
 * `perspective` = who is sending the message.
 */
export function buildIntroMessage(
  event: Event,
  sponsor: Profile,
  perspective: "sponsor" | "organizer"
): string {
  const score = calculateMatchScore(event, sponsor);
  const breakdown = getMatchBreakdown(event, sponsor, perspective);

  // Pick the top 2 compatible reasons; fall back to first items if <2 compatible
  const compatible = breakdown.filter((b) => b.compatible);
  const top = (compatible.length >= 2 ? compatible : breakdown).slice(0, 2);

  const reasonsBlock = top
    .map((r) => `• ${r.label}: ${r.reason}`)
    .join("\n");

  const opener =
    perspective === "sponsor"
      ? `¡Hola! Vi "${event.title}" y me encantó — creo que encajamos muy bien (match ${score}%).`
      : `¡Hola! Me alegra conectar contigo. Creo que "${event.title}" te puede encajar genial (match ${score}%).`;

  const closer =
    perspective === "sponsor"
      ? "¿Te parece si hablamos sobre cómo podríamos colaborar?"
      : "¿Te cuento más detalles y vemos si tiene sentido colaborar?";

  return `${opener}\n\nLo que me hace pensar que conecta:\n${reasonsBlock}\n\n${closer}\n\n— Generado desde tu perfil`;
}
