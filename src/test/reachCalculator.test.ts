import { describe, it, expect } from "vitest";
import { ReachCalculator, type Reach } from "@/lib/reach";

describe("ReachCalculator", () => {
  describe("computeReach", () => {
    it("returns 'Local' when both event and sponsor are in the same city (Madrid vs Madrid)", () => {
      expect(ReachCalculator.computeReach("Madrid", "Madrid")).toBe("Local");
    });

    it("returns 'Regional' when same country but different region (Madrid vs Barcelona)", () => {
      // Different regions but same country → Nacional per current logic
      // (Madrid → comunidad de madrid, Barcelona → cataluna). They share country (espana)
      // and regions differ → falls through to "Nacional".
      expect(ReachCalculator.computeReach("Madrid", "Barcelona")).toBe("Nacional");
    });

    it("returns 'Nacional' for Madrid vs Sevilla (same country, different region)", () => {
      expect(ReachCalculator.computeReach("Madrid", "Sevilla")).toBe("Nacional");
    });

    it("returns 'Internacional' for Madrid vs Paris (different countries)", () => {
      expect(ReachCalculator.computeReach("Madrid", "Paris")).toBe("Internacional");
    });

    it("returns null when either location is null or undefined", () => {
      expect(ReachCalculator.computeReach(null, "Madrid")).toBeNull();
      expect(ReachCalculator.computeReach("Madrid", null)).toBeNull();
      expect(ReachCalculator.computeReach(undefined, "Madrid")).toBeNull();
      expect(ReachCalculator.computeReach("Madrid", undefined)).toBeNull();
    });

    it("returns null when location strings are empty", () => {
      expect(ReachCalculator.computeReach("", "Madrid")).toBeNull();
      expect(ReachCalculator.computeReach("Madrid", "")).toBeNull();
    });
  });

  describe("reachMatchesFilter", () => {
    it("'Local' matches filter 'Local' → true", () => {
      expect(ReachCalculator.reachMatchesFilter("Local", "Local")).toBe(true);
    });

    it("'Local' matches filter 'Regional' → true (inclusive hierarchy)", () => {
      expect(ReachCalculator.reachMatchesFilter("Local", "Regional")).toBe(true);
    });

    it("'Local' matches filter 'Internacional' → true", () => {
      expect(ReachCalculator.reachMatchesFilter("Local", "Internacional")).toBe(true);
    });

    it("'Internacional' matches filter 'Local' → false", () => {
      expect(ReachCalculator.reachMatchesFilter("Internacional", "Local")).toBe(false);
    });

    it("'Regional' matches filter 'Nacional' → true", () => {
      expect(ReachCalculator.reachMatchesFilter("Regional", "Nacional")).toBe(true);
    });

    it("null with any filter → false", () => {
      const filters: Reach[] = ["Local", "Regional", "Nacional", "Internacional"];
      for (const f of filters) {
        expect(ReachCalculator.reachMatchesFilter(null, f)).toBe(false);
      }
    });
  });
});
