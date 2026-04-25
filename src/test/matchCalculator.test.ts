import { describe, it, expect } from "vitest";
import { MatchCalculator } from "@/lib/supabase-helpers";
import { mockSponsor, mockEvent, noMatchEvent } from "./fixtures";

describe("MatchCalculator", () => {
  describe("calculateMatchScore", () => {
    it("returns 100 when sector, event type, audience and budget all match perfectly", () => {
      const score = MatchCalculator.calculateMatchScore(mockEvent, mockSponsor);
      expect(score).toBe(100);
    });

    it("returns a low score (close to 0) when nothing matches", () => {
      const score = MatchCalculator.calculateMatchScore(noMatchEvent, mockSponsor);
      // No sector/type/audience match (each contributes 10% partial weight on type/audience)
      // and no budget overlap → expected very low
      expect(score).toBeLessThan(15);
    });

    it("returns 50 when there are no criteria to compare (empty preferences and no budget)", () => {
      const emptySponsor = {
        id: "x",
        industry: null,
        preferred_sectors: null,
        preferred_event_types: null,
        preferred_audiences: null,
        budget_min: null,
        budget_max: null,
      } as any;
      const emptyEvent = {
        id: "y",
        sector: null,
        type: null,
        audience: null,
        sponsorship_min: null,
        sponsorship_max: null,
      } as any;
      expect(MatchCalculator.calculateMatchScore(emptyEvent, emptySponsor)).toBe(50);
    });

    it("sector match alone contributes ~30% of the total weighted score", () => {
      const sponsorOnlySector = {
        id: "s",
        industry: null,
        preferred_sectors: ["Tecnología"],
        preferred_event_types: null,
        preferred_audiences: null,
        budget_min: null,
        budget_max: null,
      } as any;
      const eventOnlySector = {
        id: "e",
        sector: "Tecnología",
        type: null,
        audience: null,
        sponsorship_min: null,
        sponsorship_max: null,
      } as any;
      // Only sector compared (weight 30, score 30) → 100%
      expect(MatchCalculator.calculateMatchScore(eventOnlySector, sponsorOnlySector)).toBe(100);

      // Now no match → 0% of that 30 weight
      const eventNoMatchSector = { ...eventOnlySector, sector: "Música" };
      expect(MatchCalculator.calculateMatchScore(eventNoMatchSector, sponsorOnlySector)).toBe(0);
    });

    it("budget with full range overlap scores higher than partial overlap", () => {
      const sponsor = {
        id: "s",
        industry: null,
        preferred_sectors: null,
        preferred_event_types: null,
        preferred_audiences: null,
        budget_min: 5000,
        budget_max: 20000,
      } as any;
      const fullInside = {
        id: "e1",
        sector: null,
        type: null,
        audience: null,
        sponsorship_min: 8000,
        sponsorship_max: 15000,
      } as any;
      const partial = {
        id: "e2",
        sector: null,
        type: null,
        audience: null,
        sponsorship_min: 18000,
        sponsorship_max: 30000,
      } as any;

      const fullScore = MatchCalculator.calculateMatchScore(fullInside, sponsor);
      const partialScore = MatchCalculator.calculateMatchScore(partial, sponsor);
      expect(fullScore).toBeGreaterThan(partialScore);
    });
  });

  describe("getMatchBreakdown", () => {
    it("returns exactly 4 items (Sector, Tipo de evento, Audiencia, Presupuesto)", () => {
      const items = MatchCalculator.getMatchBreakdown(mockEvent, mockSponsor, "sponsor");
      expect(items).toHaveLength(4);
      expect(items.map((i) => i.label)).toEqual([
        "Sector",
        "Tipo de evento",
        "Audiencia",
        "Presupuesto",
      ]);
    });

    it("each item has label, level, compatible, and a non-empty reason", () => {
      const items = MatchCalculator.getMatchBreakdown(mockEvent, mockSponsor, "sponsor");
      for (const item of items) {
        expect(typeof item.label).toBe("string");
        expect(["high", "medium", "low"]).toContain(item.level);
        expect(typeof item.compatible).toBe("boolean");
        expect(item.reason.length).toBeGreaterThan(0);
      }
    });

    it("compatible is true only when level === 'high'", () => {
      const items = MatchCalculator.getMatchBreakdown(mockEvent, mockSponsor, "sponsor");
      for (const item of items) {
        expect(item.compatible).toBe(item.level === "high");
      }
      const lowItems = MatchCalculator.getMatchBreakdown(noMatchEvent, mockSponsor, "sponsor");
      for (const item of lowItems) {
        expect(item.compatible).toBe(item.level === "high");
      }
    });

    it("reason text changes depending on perspective", () => {
      const sponsorView = MatchCalculator.getMatchBreakdown(mockEvent, mockSponsor, "sponsor");
      const organizerView = MatchCalculator.getMatchBreakdown(mockEvent, mockSponsor, "organizer");
      // At least one item differs in its reason text between perspectives
      const differs = sponsorView.some((s, i) => s.reason !== organizerView[i].reason);
      expect(differs).toBe(true);
    });

    it("sector level: high on exact match, medium on partial, low on no match", () => {
      const exact = MatchCalculator.getMatchBreakdown(mockEvent, mockSponsor, "sponsor");
      expect(exact[0].label).toBe("Sector");
      expect(exact[0].level).toBe("high");

      const partialEvent = { ...mockEvent, sector: "Tec" } as any; // substring of "Tecnología"
      const partial = MatchCalculator.getMatchBreakdown(partialEvent, mockSponsor, "sponsor");
      expect(partial[0].level).toBe("medium");

      const noMatch = MatchCalculator.getMatchBreakdown(noMatchEvent, mockSponsor, "sponsor");
      expect(noMatch[0].level).toBe("low");
    });
  });
});
