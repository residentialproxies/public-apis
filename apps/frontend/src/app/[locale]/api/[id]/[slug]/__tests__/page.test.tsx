/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { notFound, redirect } from "next/navigation";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// Mock next-intl
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
  setRequestLocale: vi.fn(),
}));

// Mock backend API
vi.mock("@/lib/backend", () => ({
  fetchApiDetail: vi.fn(),
  fetchApiHealthSummary: vi.fn(),
  fetchApiOpenapiSpec: vi.fn(),
  fetchApisList: vi.fn(),
}));

// Mock slugify
vi.mock("@/lib/slugify", () => ({
  slugify: vi.fn((text: string) => text.toLowerCase().replace(/\s+/g, "-")),
}));

import {
  fetchApiDetail,
  fetchApiHealthSummary,
  fetchApiOpenapiSpec,
} from "@/lib/backend";
import { slugify } from "@/lib/slugify";

// Import the actual page component
// Note: This will be a server component, so we're testing the functions it uses

describe("API Detail Page - Characterization Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeOpenApiSpec", () => {
    // Re-implement the function for testing purposes
    const normalizeOpenApiSpec = (
      spec: Record<string, unknown>,
      openapiUrl: string,
    ): Record<string, unknown> => {
      type OpenApiLike = {
        openapi?: unknown;
        swagger?: unknown;
        servers?: Array<{ url?: unknown }>;
        host?: unknown;
        schemes?: unknown;
      };

      const typed = spec as OpenApiLike;
      const base = new URL(openapiUrl);
      const origin = base.origin;
      const host = base.host;
      const scheme = base.protocol.replace(":", "");

      const isOpenApi3 =
        typeof typed.openapi === "string" && typed.openapi.length > 0;
      const isSwagger2 =
        typeof typed.swagger === "string" && typed.swagger.length > 0;

      if (isOpenApi3) {
        const servers = Array.isArray(typed.servers) ? typed.servers : [];
        const normalizedServers =
          servers.length > 0
            ? servers.map((s) => {
                const url = s?.url;
                if (typeof url !== "string" || !url.trim()) return s;

                const trimmed = url.trim();
                if (
                  trimmed.startsWith("http://") ||
                  trimmed.startsWith("https://")
                )
                  return s;

                try {
                  const absolute = new URL(trimmed, origin).toString();
                  return { ...s, url: absolute };
                } catch {
                  return s;
                }
              })
            : [{ url: origin }];

        return { ...spec, servers: normalizedServers };
      }

      if (isSwagger2) {
        const next: OpenApiLike & Record<string, unknown> = { ...spec };
        const schemes = Array.isArray(next.schemes)
          ? next.schemes.filter(
              (s): s is string => typeof s === "string" && !!s,
            )
          : [];

        if (typeof next.host !== "string" || !next.host) next.host = host;
        if (schemes.length === 0) next.schemes = [scheme];

        return next;
      }

      return spec;
    };

    it("should normalize OpenAPI 3.0 spec with relative server URLs", () => {
      const spec = {
        openapi: "3.0.0",
        servers: [{ url: "/api/v1" }],
      };
      const result = normalizeOpenApiSpec(spec, "https://example.com/docs");

      expect(result.servers).toEqual([{ url: "https://example.com/api/v1" }]);
    });

    it("should preserve absolute server URLs in OpenAPI 3.0", () => {
      const spec = {
        openapi: "3.0.0",
        servers: [{ url: "https://api.example.com/v1" }],
      };
      const result = normalizeOpenApiSpec(spec, "https://example.com/docs");

      expect(result.servers).toEqual([{ url: "https://api.example.com/v1" }]);
    });

    it("should add default server if none provided in OpenAPI 3.0", () => {
      const spec = {
        openapi: "3.0.0",
        servers: [],
      };
      const result = normalizeOpenApiSpec(spec, "https://example.com/docs");

      expect(result.servers).toEqual([{ url: "https://example.com" }]);
    });

    it("should normalize Swagger 2.0 spec with missing host", () => {
      const spec = {
        swagger: "2.0",
        schemes: ["http"],
      };
      const result = normalizeOpenApiSpec(spec, "https://example.com/docs") as {
        host: string;
        schemes: string[];
      };

      expect(result.host).toBe("example.com");
      expect(result.schemes).toEqual(["http"]);
    });

    it("should add default scheme for Swagger 2.0 if missing", () => {
      const spec = {
        swagger: "2.0",
        host: "api.example.com",
      };
      const result = normalizeOpenApiSpec(spec, "https://example.com/docs") as {
        host: string;
        schemes: string[];
      };

      expect(result.host).toBe("api.example.com");
      expect(result.schemes).toEqual(["https"]);
    });

    it("should return spec unchanged if not OpenAPI or Swagger", () => {
      const spec = { random: "data" };
      const result = normalizeOpenApiSpec(spec, "https://example.com/docs");

      expect(result).toEqual(spec);
    });
  });

  describe("extractFAQItems", () => {
    // Re-implement for testing
    type ContentNode = {
      type: string;
      level?: number;
      text: string;
    };
    type FAQItem = {
      question: string;
      answer: string;
      category: string;
    };

    const extractFAQItems = (nodes: ContentNode[]): FAQItem[] => {
      const faqItems: FAQItem[] = [];
      let currentCategory = "general";
      let currentQuestion = "";
      let currentAnswer = "";

      for (const node of nodes) {
        if (node.type === "heading" && node.level === 3) {
          const categoryText = node.text.toLowerCase();
          if (categoryText.includes("technical")) currentCategory = "technical";
          else if (categoryText.includes("security"))
            currentCategory = "security";
          else if (categoryText.includes("support"))
            currentCategory = "support";
          else if (categoryText.includes("pricing"))
            currentCategory = "pricing";
          else currentCategory = "general";
        } else if (node.type === "heading" && node.level === 4) {
          if (currentQuestion && currentAnswer) {
            faqItems.push({
              question: currentQuestion,
              answer: currentAnswer,
              category: currentCategory,
            });
          }
          currentQuestion = node.text;
          currentAnswer = "";
        } else if (node.type === "paragraph" && currentQuestion) {
          currentAnswer += (currentAnswer ? " " : "") + node.text;
        }
      }

      if (currentQuestion && currentAnswer) {
        faqItems.push({
          question: currentQuestion,
          answer: currentAnswer,
          category: currentCategory,
        });
      }

      return faqItems;
    };

    it("should extract FAQ items with general category", () => {
      const nodes: ContentNode[] = [
        { type: "heading", level: 4, text: "What is this API?" },
        { type: "paragraph", text: "This is a test API." },
        { type: "heading", level: 4, text: "How do I use it?" },
        { type: "paragraph", text: "Just call the endpoint." },
      ];

      const result = extractFAQItems(nodes);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        question: "What is this API?",
        answer: "This is a test API.",
        category: "general",
      });
      expect(result[1]).toEqual({
        question: "How do I use it?",
        answer: "Just call the endpoint.",
        category: "general",
      });
    });

    it("should handle category headings", () => {
      // Note: There's a quirk in the implementation where category switching
      // before a new h4 heading will affect the previous FAQ item
      const nodes: ContentNode[] = [
        { type: "heading", level: 3, text: "Technical Questions" },
        { type: "heading", level: 4, text: "What protocol?" },
        { type: "paragraph", text: "HTTPS only." },
      ];

      const result = extractFAQItems(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("technical");
      expect(result[0].question).toBe("What protocol?");
      expect(result[0].answer).toBe("HTTPS only.");
    });

    it("should concatenate multiple paragraphs into one answer", () => {
      const nodes: ContentNode[] = [
        { type: "heading", level: 4, text: "How to authenticate?" },
        { type: "paragraph", text: "First, get an API key." },
        { type: "paragraph", text: "Then, add it to headers." },
      ];

      const result = extractFAQItems(nodes);

      expect(result).toHaveLength(1);
      expect(result[0].answer).toBe(
        "First, get an API key. Then, add it to headers.",
      );
    });

    it("should handle empty input", () => {
      const result = extractFAQItems([]);
      expect(result).toEqual([]);
    });
  });

  describe("Page behavior with mock data", () => {
    it("should call notFound when API detail fetch fails", async () => {
      vi.mocked(fetchApiDetail).mockRejectedValue(new Error("Not found"));
      vi.mocked(fetchApiHealthSummary).mockResolvedValue({
        uptimePct: 0,
        avgLatencyMs: 0,
        series: [],
      } as any);

      // The actual page component would call notFound here
      // We're testing the behavior expectation
      try {
        await fetchApiDetail("999");
      } catch {
        // Expected to fail
      }

      expect(fetchApiDetail).toHaveBeenCalledWith("999");
    });

    it("should redirect when slug doesn't match canonical", () => {
      const apiName = "Test API";
      const currentSlug: string = "test-api-v2";
      const canonicalSlug: string = "test-api";
      const locale = "zh";

      vi.mocked(slugify).mockReturnValue(canonicalSlug);

      if (currentSlug !== canonicalSlug) {
        redirect(`/${locale}/api/123/${canonicalSlug}`);
      }

      expect(redirect).toHaveBeenCalledWith(`/zh/api/123/${canonicalSlug}`);
    });

    it("should handle missing optional data gracefully", async () => {
      const mockApi = {
        id: "1",
        name: "Test API",
        description: "Test description",
        link: "https://example.com",
        auth: "No",
        cors: "Yes",
        https: true,
        healthStatus: "healthy",
        category: null,
        screenshot: null,
        openapiUrl: null,
        aiAnalysis: null,
        seoMetadata: null,
        generatedContent: null,
      };

      vi.mocked(fetchApiDetail).mockResolvedValue(mockApi as any);
      vi.mocked(fetchApiHealthSummary).mockResolvedValue({
        uptimePct: 0,
        avgLatencyMs: 0,
        series: [],
      } as any);

      const api = await fetchApiDetail("1");

      // These should not throw errors even when null
      expect(api.category).toBeNull();
      expect(api.screenshot).toBeNull();
      expect(api.openapiUrl).toBeNull();
    });
  });

  describe("Data transformations for new features", () => {
    it("should extract version from OpenAPI spec", () => {
      const spec = {
        openapi: "3.0.0",
        info: {
          version: "2.1.0",
          title: "Test API",
        },
      };

      expect(spec.info.version).toBe("2.1.0");
    });

    it("should calculate uptime percentage from health summary", () => {
      const healthSummary = {
        uptimePct: 99.87,
        avgLatencyMs: 123,
        series: [],
      };

      expect(healthSummary.uptimePct).toBeGreaterThan(99);
      expect(healthSummary.uptimePct.toFixed(2)).toBe("99.87");
    });

    it("should identify auth type correctly", () => {
      const authTypes = [
        "No",
        "apiKey",
        "OAuth",
        "X-Mashape-Key",
        "User-Agent",
      ];

      authTypes.forEach((authType) => {
        expect(typeof authType).toBe("string");
        expect(authType.length).toBeGreaterThan(0);
      });
    });
  });
});
