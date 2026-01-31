import { describe, expect, it } from "vitest";

/**
 * Test the clamp function logic used in VibeRadarChart
 * This validates that values are properly clamped to 0-100 range
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

describe("VibeRadarChart Value Clamping", () => {
  describe("clamp function", () => {
    it("should clamp values above 100 to 100", () => {
      expect(clamp(105, 0, 100)).toBe(100);
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(200, 0, 100)).toBe(100);
    });

    it("should clamp values below 0 to 0", () => {
      expect(clamp(-5, 0, 100)).toBe(0);
      expect(clamp(-50, 0, 100)).toBe(0);
      expect(clamp(-100, 0, 100)).toBe(0);
    });

    it("should leave values within range unchanged", () => {
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(100, 0, 100)).toBe(100);
      expect(clamp(75, 0, 100)).toBe(75);
    });

    it("should handle edge cases", () => {
      expect(clamp(100.1, 0, 100)).toBe(100);
      expect(clamp(-0.1, 0, 100)).toBe(0);
      expect(clamp(99.9, 0, 100)).toBe(99.9);
    });
  });

  describe("display value formatting", () => {
    it("should round and clamp displayed percentages", () => {
      // Simulating the display logic: Math.min(Math.round(value), 100)
      const formatDisplayValue = (value: number) => Math.min(Math.round(value), 100);
      
      expect(formatDisplayValue(105)).toBe(100);
      expect(formatDisplayValue(99.6)).toBe(100);
      expect(formatDisplayValue(99.4)).toBe(99);
      expect(formatDisplayValue(50.5)).toBe(51);
      expect(formatDisplayValue(150)).toBe(100);
    });
  });
});
