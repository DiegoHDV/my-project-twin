import type { Event, Profile } from "@/lib/supabase-helpers";
import { MatchCalculator } from "@/lib/supabase-helpers";

/**
 * IntroMessageBuilder — construye un mensaje de presentación automático
 * entre sponsor y organizador en base al evento y al breakdown de match.
 */
export class IntroMessageBuilder {
  static build(
    event: Event,
    sponsor: Profile,
    perspective: "sponsor" | "organizer"
  ): string {
    const score = MatchCalculator.calculateMatchScore(event, sponsor);
    const breakdown = MatchCalculator.getMatchBreakdown(event, sponsor, perspective);

    const compatible = breakdown.filter((b) => b.compatible);
    const top = (compatible.length >= 2 ? compatible : breakdown).slice(0, 2);

    const reasonsBlock = top.map((r) => `• ${r.label}: ${r.reason}`).join("\n");

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
}
