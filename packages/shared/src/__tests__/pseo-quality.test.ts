/**
 * Unit tests for PSEO Quality Scoring System
 */

import { describe, it, expect } from "vitest";
import {
  ContentQualityScorer,
  ContentCompletenessAnalyzer,
  SEOScoreCalculator,
} from "../pseo-quality";
import type { TemplateContext } from "../pseo-templates";

describe("ContentQualityScorer", () => {
  const scorer = new ContentQualityScorer();

  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "A comprehensive test API",
      link: "https://api.example.com",
      openapiUrl: "https://api.example.com/openapi.json",
      category: {
        id: 1,
        name: "Development",
        slug: "development",
      },
      auth: "apiKey",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      seoMetadata: {
        docQualityScore: 8,
        hasCodeExamples: true,
        keywords: [
          { keyword: "api" },
          { keyword: "testing" },
          { keyword: "development" },
        ],
        h2s: [{ heading: "Getting Started" }, { heading: "API Reference" }],
        languages: [{ language: "JavaScript" }, { language: "Python" }],
      },
      aiAnalysis: {
        summary: "A powerful testing API",
        useCases: [{ tag: "testing" }, { tag: "development" }],
      },
      generatedContent: {
        seoTitle: "Test API - Complete Guide",
        blogPost: "Long form content here...",
      },
    },
    locale: "en",
  };

  it("should calculate overall quality score", () => {
    const score = scorer.calculateScore(mockContext);

    expect(score).toBeDefined();
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it("should include breakdown scores", () => {
    const score = scorer.calculateScore(mockContext);

    expect(score.breakdown).toBeDefined();
    expect(score.breakdown.basicInfo).toBeGreaterThanOrEqual(0);
    expect(score.breakdown.technicalDocs).toBeGreaterThanOrEqual(0);
    expect(score.breakdown.codeExamples).toBeGreaterThanOrEqual(0);
    expect(score.breakdown.seoOptimization).toBeGreaterThanOrEqual(0);
    expect(score.breakdown.userGuidance).toBeGreaterThanOrEqual(0);
  });

  it("should award full basicInfo score for complete basic data", () => {
    const score = scorer.calculateScore(mockContext);

    expect(score.breakdown.basicInfo).toBe(20);
  });

  it("should award high technicalDocs score for OpenAPI + quality", () => {
    const score = scorer.calculateScore(mockContext);

    expect(score.breakdown.technicalDocs).toBeGreaterThan(15);
  });

  it("should award high codeExamples score for multiple languages", () => {
    const score = scorer.calculateScore(mockContext);

    expect(score.breakdown.codeExamples).toBeGreaterThan(15);
  });

  it("should generate recommendations for low scores", () => {
    const minimalContext: TemplateContext = {
      api: {
        id: 1,
        name: "Minimal API",
        description: "Basic API",
        link: "https://api.example.com",
        auth: "No",
        cors: "No",
        https: true,
        healthStatus: "unknown",
      },
      locale: "en",
    };

    const score = scorer.calculateScore(minimalContext);

    expect(score.recommendations).toBeDefined();
    expect(score.recommendations.length).toBeGreaterThan(0);
  });

  it("should return correct grade for score", () => {
    expect(scorer.getGrade(95)).toBe("A+");
    expect(scorer.getGrade(85)).toBe("A");
    expect(scorer.getGrade(80)).toBe("A-");
    expect(scorer.getGrade(75)).toBe("B+");
    expect(scorer.getGrade(50)).toBe("C-");
    expect(scorer.getGrade(30)).toBe("F");
  });

  it("should return correct status for score", () => {
    expect(scorer.getStatus(85)).toBe("excellent");
    expect(scorer.getStatus(70)).toBe("good");
    expect(scorer.getStatus(55)).toBe("fair");
    expect(scorer.getStatus(30)).toBe("poor");
  });

  it("should include calculatedAt timestamp", () => {
    const score = scorer.calculateScore(mockContext);

    expect(score.calculatedAt).toBeDefined();
    expect(new Date(score.calculatedAt).getTime()).toBeGreaterThan(0);
  });
});

describe("ContentCompletenessAnalyzer", () => {
  const analyzer = new ContentCompletenessAnalyzer();

  it("should analyze available content blocks", () => {
    const context: TemplateContext = {
      api: {
        id: 1,
        name: "Test API",
        description: "Test",
        link: "https://api.example.com",
        openapiUrl: "https://api.example.com/openapi.json",
        auth: "No",
        cors: "Yes",
        https: true,
        healthStatus: "live",
        seoMetadata: {
          hasCodeExamples: true,
          languages: [{ language: "JavaScript" }],
        },
        aiAnalysis: {
          useCases: [{ tag: "testing" }],
        },
        generatedContent: {
          blogPost: "Content here",
        },
        screenshot: {
          thumbnailUrl: "https://example.com/thumb.jpg",
          fullUrl: "https://example.com/full.jpg",
          capturedAt: "2025-01-01",
        },
      },
      healthSummary: {
        uptimePct: 99,
        series: [{ date: "2025-01-01", status: "live" }],
      },
      relatedApis: [
        {
          id: 2,
          name: "Related API",
          description: "Related",
          auth: "No",
          cors: "Yes",
          https: true,
        },
      ],
      locale: "en",
    };

    const result = analyzer.analyzeCompleteness(context);

    expect(result.availableBlocks).toContain("getting_started");
    expect(result.availableBlocks).toContain("code_examples");
    expect(result.availableBlocks).toContain("api_reference");
    expect(result.availableBlocks).toContain("faq");
    expect(result.availableBlocks).toContain("use_cases");
    expect(result.availableBlocks).toContain("performance_chart");
    expect(result.availableBlocks).toContain("screenshot");
    expect(result.availableBlocks).toContain("deep_dive_article");
    expect(result.availableBlocks).toContain("related_apis");
  });

  it("should identify missing blocks", () => {
    const minimalContext: TemplateContext = {
      api: {
        id: 1,
        name: "Minimal API",
        description: "Minimal",
        link: "https://api.example.com",
        auth: "No",
        cors: "No",
        https: true,
        healthStatus: "unknown",
      },
      locale: "en",
    };

    const result = analyzer.analyzeCompleteness(minimalContext);

    expect(result.missingBlocks).toContain("code_examples");
    expect(result.missingBlocks).toContain("api_reference");
    expect(result.missingBlocks).toContain("use_cases");
  });

  it("should calculate completeness percentage", () => {
    const context: TemplateContext = {
      api: {
        id: 1,
        name: "Test API",
        description: "Test",
        link: "https://api.example.com",
        auth: "No",
        cors: "Yes",
        https: true,
        healthStatus: "live",
      },
      locale: "en",
    };

    const result = analyzer.analyzeCompleteness(context);

    expect(result.completeness).toBeGreaterThanOrEqual(0);
    expect(result.completeness).toBeLessThanOrEqual(100);
  });
});

describe("SEOScoreCalculator", () => {
  const calculator = new SEOScoreCalculator();

  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "A comprehensive test API for developers and testers",
      link: "https://api.example.com",
      category: {
        id: 1,
        name: "Development",
        slug: "development",
      },
      auth: "apiKey",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      seoMetadata: {
        title: "Test API - Complete Guide",
        description:
          "Learn how to use the Test API with our comprehensive guide including code examples, authentication details, and best practices for developers.",
        keywords: [
          { keyword: "api" },
          { keyword: "testing" },
          { keyword: "development" },
          { keyword: "rest" },
          { keyword: "http" },
        ],
        h2s: [{ heading: "Getting Started" }, { heading: "API Reference" }],
        languages: [{ language: "JavaScript" }, { language: "Python" }],
        ogImage: "https://example.com/og.jpg",
      },
      generatedContent: {
        seoTitle: "Test API - Developer Guide & Documentation",
        blogPost: "This is a comprehensive guide... ".repeat(100), // ~1500 words
      },
    },
    relatedApis: [
      {
        id: 2,
        name: "API 1",
        description: "1",
        auth: "No",
        cors: "Yes",
        https: true,
      },
      {
        id: 3,
        name: "API 2",
        description: "2",
        auth: "No",
        cors: "Yes",
        https: true,
      },
      {
        id: 4,
        name: "API 3",
        description: "3",
        auth: "No",
        cors: "Yes",
        https: true,
      },
    ],
    locale: "en",
  };

  it("should calculate overall SEO score", () => {
    const score = calculator.calculateSEOScore(mockContext);

    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it("should include all SEO factor scores", () => {
    const score = calculator.calculateSEOScore(mockContext);

    expect(score.factors.titleOptimization).toBeDefined();
    expect(score.factors.metaDescription).toBeDefined();
    expect(score.factors.contentLength).toBeDefined();
    expect(score.factors.keywordDensity).toBeDefined();
    expect(score.factors.structuredData).toBeDefined();
    expect(score.factors.internalLinks).toBeDefined();
    expect(score.factors.imageOptimization).toBeDefined();
    expect(score.factors.mobileOptimization).toBeDefined();
  });

  it("should give high score for optimized title length", () => {
    const score = calculator.calculateSEOScore(mockContext);

    expect(score.factors.titleOptimization).toBeGreaterThan(70);
  });

  it("should give high score for sufficient content length", () => {
    const score = calculator.calculateSEOScore(mockContext);

    expect(score.factors.contentLength).toBeGreaterThan(50);
  });

  it("should give high score for good keyword density", () => {
    const score = calculator.calculateSEOScore(mockContext);

    expect(score.factors.keywordDensity).toBeGreaterThan(50);
  });

  it("should give high score for structured data", () => {
    const score = calculator.calculateSEOScore(mockContext);

    expect(score.factors.structuredData).toBeGreaterThan(50);
  });

  it("should give high score for good internal linking", () => {
    const score = calculator.calculateSEOScore(mockContext);

    expect(score.factors.internalLinks).toBeGreaterThan(40);
  });

  it("should give perfect mobile optimization score", () => {
    const score = calculator.calculateSEOScore(mockContext);

    expect(score.factors.mobileOptimization).toBe(100);
  });
});
