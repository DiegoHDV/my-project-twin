import { describe, it, expect } from "vitest";
import { IntroMessageBuilder } from "@/lib/intro-message";
import { MatchCalculator } from "@/lib/supabase-helpers";
import { mockEvent, mockSponsor, noMatchEvent } from "./fixtures";

describe("IntroMessageBuilder", () => {
  describe("build", () => {
    it("contains the event title", () => {
      const msg = IntroMessageBuilder.build(mockEvent, mockSponsor, "sponsor");
      expect(msg).toContain(mockEvent.title);
    });

    it("contains the match score as a percentage", () => {
      const score = MatchCalculator.calculateMatchScore(mockEvent, mockSponsor);
      const msg = IntroMessageBuilder.build(mockEvent, mockSponsor, "sponsor");
      expect(msg).toContain(`${score}%`);
    });

    it("contains at least 2 bullet points (lines starting with •)", () => {
      const msg = IntroMessageBuilder.build(mockEvent, mockSponsor, "sponsor");
      const bullets = msg.split("\n").filter((l) => l.trim().startsWith("•"));
      expect(bullets.length).toBeGreaterThanOrEqual(2);
    });

    it("when perspective is 'sponsor', the opener mentions seeing the event ('Vi')", () => {
      const msg = IntroMessageBuilder.build(mockEvent, mockSponsor, "sponsor");
      expect(msg).toContain("Vi");
    });

    it("when perspective is 'organizer', the opener is different and mentions connecting", () => {
      const sponsorMsg = IntroMessageBuilder.build(mockEvent, mockSponsor, "sponsor");
      const organizerMsg = IntroMessageBuilder.build(mockEvent, mockSponsor, "organizer");
      expect(organizerMsg).not.toBe(sponsorMsg);
      expect(organizerMsg.toLowerCase()).toContain("conectar");
    });

    it("ends with '— Generado desde tu perfil'", () => {
      const msg = IntroMessageBuilder.build(mockEvent, mockSponsor, "sponsor");
      expect(msg.trimEnd().endsWith("— Generado desde tu perfil")).toBe(true);
    });

    it("returns a non-empty string for any valid input combination", () => {
      const combos: Array<["sponsor" | "organizer", any]> = [
        ["sponsor", mockEvent],
        ["organizer", mockEvent],
        ["sponsor", noMatchEvent],
        ["organizer", noMatchEvent],
      ];
      for (const [persp, ev] of combos) {
        const msg = IntroMessageBuilder.build(ev, mockSponsor, persp);
        expect(typeof msg).toBe("string");
        expect(msg.length).toBeGreaterThan(0);
      }
    });
  });
});
