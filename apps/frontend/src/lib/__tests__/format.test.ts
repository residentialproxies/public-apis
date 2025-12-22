import { describe, it, expect } from "vitest";
import { formatDate, formatNumber, slugify } from "../format";

describe("format utilities", () => {
  describe("formatDate", () => {
    it("should format Date object correctly", () => {
      const date = new Date("2025-12-18T10:00:00Z");
      const result = formatDate(date);
      expect(result).toMatch(/Dec 18, 2025/);
    });

    it("should format ISO string correctly", () => {
      const result = formatDate("2025-12-18T10:00:00Z");
      expect(result).toMatch(/Dec 18, 2025/);
    });

    it("should handle null/undefined", () => {
      expect(formatDate(null)).toBe("Never");
      expect(formatDate(undefined)).toBe("Never");
    });
  });

  describe("formatNumber", () => {
    it("should format numbers with commas", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("should handle zero", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("should handle negative numbers", () => {
      expect(formatNumber(-1000)).toBe("-1,000");
    });
  });

  describe("slugify", () => {
    it("should convert text to URL-friendly slug", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("API Navigator")).toBe("api-navigator");
    });

    it("should handle special characters", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
      expect(slugify("Test & Example")).toBe("test-example");
    });

    it("should handle multiple spaces", () => {
      expect(slugify("Hello   World")).toBe("hello-world");
    });

    it("should trim whitespace", () => {
      expect(slugify("  Hello World  ")).toBe("hello-world");
    });
  });
});
