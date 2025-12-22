import { describe, it, expect } from "vitest";
import {
  firstParam,
  allParams,
  parseNumber,
  parseBoolean,
} from "../search-params";

describe("search-params utilities", () => {
  describe("firstParam", () => {
    it("should return first value from array", () => {
      expect(firstParam(["value1", "value2"])).toBe("value1");
    });

    it("should return string value as-is", () => {
      expect(firstParam("value")).toBe("value");
    });

    it("should return undefined for undefined", () => {
      expect(firstParam(undefined)).toBeUndefined();
    });

    it("should return undefined for empty array", () => {
      expect(firstParam([])).toBeUndefined();
    });
  });

  describe("allParams", () => {
    it("should return array for array input", () => {
      const result = allParams(["val1", "val2"]);
      expect(result).toEqual(["val1", "val2"]);
    });

    it("should wrap string in array", () => {
      const result = allParams("value");
      expect(result).toEqual(["value"]);
    });

    it("should return empty array for undefined", () => {
      const result = allParams(undefined);
      expect(result).toEqual([]);
    });
  });

  describe("parseNumber", () => {
    it("should parse valid number strings", () => {
      expect(parseNumber("123")).toBe(123);
      expect(parseNumber("0")).toBe(0);
      expect(parseNumber("-42")).toBe(-42);
    });

    it("should return undefined for invalid numbers", () => {
      expect(parseNumber("abc")).toBeUndefined();
      expect(parseNumber("12.34.56")).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(parseNumber(undefined)).toBeUndefined();
    });

    it("should apply min constraint", () => {
      expect(parseNumber("5", { min: 10 })).toBeUndefined();
      expect(parseNumber("10", { min: 10 })).toBe(10);
      expect(parseNumber("15", { min: 10 })).toBe(15);
    });

    it("should apply max constraint", () => {
      expect(parseNumber("15", { max: 10 })).toBeUndefined();
      expect(parseNumber("10", { max: 10 })).toBe(10);
      expect(parseNumber("5", { max: 10 })).toBe(5);
    });
  });

  describe("parseBoolean", () => {
    it("should parse truthy values", () => {
      expect(parseBoolean("true")).toBe(true);
      expect(parseBoolean("1")).toBe(true);
      expect(parseBoolean("yes")).toBe(true);
    });

    it("should parse falsy values", () => {
      expect(parseBoolean("false")).toBe(false);
      expect(parseBoolean("0")).toBe(false);
      expect(parseBoolean("no")).toBe(false);
    });

    it("should return undefined for undefined", () => {
      expect(parseBoolean(undefined)).toBeUndefined();
    });

    it("should return undefined for invalid values", () => {
      expect(parseBoolean("maybe")).toBeUndefined();
      expect(parseBoolean("invalid")).toBeUndefined();
    });
  });
});
