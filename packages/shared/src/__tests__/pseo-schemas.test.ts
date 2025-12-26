/**
 * Unit tests for PSEO Schema.org Generators
 */

import { describe, it, expect } from "vitest";
import {
  WebAPISchema,
  SoftwareApplicationSchema,
  FAQSchema,
  HowToSchema,
  ArticleSchema,
  BreadcrumbListSchema,
  ProductSchema,
  schemaManager,
} from "../pseo-schemas";
import type { TemplateContext, FAQItem } from "../pseo-templates";

describe("WebAPISchema", () => {
  const generator = new WebAPISchema();

  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "A comprehensive test API",
      link: "https://api.example.com",
      openapiUrl: "https://api.example.com/openapi.json",
      auth: "apiKey",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      latencyMs: 150,
      seoMetadata: {
        keywords: [{ keyword: "api" }, { keyword: "testing" }],
        languages: [{ language: "JavaScript" }, { keyword: "Python" }],
        docQualityScore: 8,
        hasCodeExamples: true,
      },
      aiAnalysis: {
        useCases: [{ tag: "testing" }, { tag: "development" }],
      },
    },
    healthSummary: {
      uptimePct: 99.5,
      avgLatencyMs: 150,
    },
    locale: "en",
  };

  it("should generate valid WebAPI schema", () => {
    const schema = generator.generate(mockContext);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("WebAPI");
    expect(schema.name).toBe("Test API");
    expect(schema.description).toBeDefined();
  });

  it("should include API URL and documentation", () => {
    const schema = generator.generate(mockContext);

    expect(schema.url).toBeDefined();
    expect(schema.documentation).toBe("https://api.example.com/openapi.json");
  });

  it("should include provider information", () => {
    const schema = generator.generate(mockContext);

    expect(schema.provider).toBeDefined();
    expect(schema.provider).toHaveProperty("@type", "Organization");
    expect(schema.provider).toHaveProperty("name");
  });

  it("should include additional properties", () => {
    const schema = generator.generate(mockContext);

    expect(schema.additionalProperty).toBeDefined();
    expect(Array.isArray(schema.additionalProperty)).toBe(true);

    const props = schema.additionalProperty as Array<{
      name: string;
      value: unknown;
    }>;
    const authProp = props.find((p) => p.name === "Authentication");
    expect(authProp).toBeDefined();
    expect(authProp?.value).toBe("apiKey");
  });

  it("should include programming languages", () => {
    const schema = generator.generate(mockContext);

    expect(schema.programmingLanguage).toBeDefined();
  });
});

describe("SoftwareApplicationSchema", () => {
  const generator = new SoftwareApplicationSchema();

  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "A test API",
      link: "https://api.example.com",
      auth: "No",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      seoMetadata: {
        docQualityScore: 9,
      },
    },
    locale: "en",
  };

  it("should generate valid SoftwareApplication schema", () => {
    const schema = generator.generate(mockContext);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("SoftwareApplication");
    expect(schema.applicationCategory).toBe("DeveloperApplication");
    expect(schema.operatingSystem).toBe("Web API");
  });

  it("should include free pricing for public APIs", () => {
    const schema = generator.generate(mockContext);

    expect(schema.offers).toBeDefined();
    expect(schema.offers).toHaveProperty("@type", "Offer");
    expect(schema.offers).toHaveProperty("price", "0");
    expect(schema.offers).toHaveProperty("priceCurrency", "USD");
  });

  it("should include aggregate rating if quality score exists", () => {
    const schema = generator.generate(mockContext);

    expect(schema.aggregateRating).toBeDefined();
    expect(schema.aggregateRating).toHaveProperty("@type", "AggregateRating");
    expect(schema.aggregateRating).toHaveProperty("ratingValue", 9);
  });
});

describe("FAQSchema", () => {
  const generator = new FAQSchema();

  const mockContext: TemplateContext = {
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

  const faqItems: FAQItem[] = [
    {
      question: "How do I get started?",
      answer: "You can start by visiting our documentation.",
      category: "general",
    },
    {
      question: "Is it free?",
      answer: "Yes, the API is free to use.",
      category: "pricing",
    },
  ];

  it("should generate valid FAQPage schema", () => {
    const schema = generator.generate(mockContext, faqItems);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toBeDefined();
  });

  it("should include all FAQ items", () => {
    const schema = generator.generate(mockContext, faqItems);

    expect(Array.isArray(schema.mainEntity)).toBe(true);
    expect(schema.mainEntity).toHaveLength(2);
  });

  it("should format FAQ items correctly", () => {
    const schema = generator.generate(mockContext, faqItems);

    const firstItem = schema.mainEntity[0];
    expect(firstItem).toHaveProperty("@type", "Question");
    expect(firstItem).toHaveProperty("name", "How do I get started?");
    expect(firstItem).toHaveProperty("acceptedAnswer");
    expect(firstItem.acceptedAnswer).toHaveProperty("@type", "Answer");
    expect(firstItem.acceptedAnswer).toHaveProperty(
      "text",
      "You can start by visiting our documentation.",
    );
  });
});

describe("HowToSchema", () => {
  const generator = new HowToSchema();

  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "A test API",
      link: "https://api.example.com",
      openapiUrl: "https://api.example.com/openapi.json",
      auth: "apiKey",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      seoMetadata: {
        hasCodeExamples: true,
      },
    },
    locale: "en",
  };

  it("should generate valid HowTo schema", () => {
    const schema = generator.generate(mockContext);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("HowTo");
    expect(schema.name).toContain("Test API");
  });

  it("should include steps", () => {
    const schema = generator.generate(mockContext);

    expect(schema.step).toBeDefined();
    expect(Array.isArray(schema.step)).toBe(true);
    expect(schema.step.length).toBeGreaterThan(0);
  });

  it("should include registration step for authenticated APIs", () => {
    const schema = generator.generate(mockContext);

    const registrationStep = schema.step.find((s: { name: string }) =>
      s.name.toLowerCase().includes("register"),
    );
    expect(registrationStep).toBeDefined();
  });

  it("should not include registration for public APIs", () => {
    const publicContext: TemplateContext = {
      ...mockContext,
      api: { ...mockContext.api, auth: "No" },
    };

    const schema = generator.generate(publicContext);

    const registrationStep = schema.step.find((s: { name: string }) =>
      s.name.toLowerCase().includes("register"),
    );
    expect(registrationStep).toBeUndefined();
  });
});

describe("ArticleSchema", () => {
  const generator = new ArticleSchema();

  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "A test API",
      link: "https://api.example.com",
      auth: "No",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      generatedContent: {
        seoTitle: "Test API Guide",
        blogPost: "Content here",
        lastGeneratedAt: "2025-01-01T00:00:00Z",
      },
      aiAnalysis: {
        summary: "A comprehensive API",
      },
    },
    locale: "en",
  };

  it("should generate valid Article schema", () => {
    const schema = generator.generate(mockContext);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("Test API Guide");
  });

  it("should include author and publisher", () => {
    const schema = generator.generate(mockContext);

    expect(schema.author).toHaveProperty("@type", "Organization");
    expect(schema.publisher).toHaveProperty("@type", "Organization");
  });

  it("should include publication dates", () => {
    const schema = generator.generate(mockContext);

    expect(schema.datePublished).toBe("2025-01-01T00:00:00Z");
    expect(schema.dateModified).toBe("2025-01-01T00:00:00Z");
  });
});

describe("BreadcrumbListSchema", () => {
  const generator = new BreadcrumbListSchema();

  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "Test",
      link: "https://api.example.com",
      category: {
        id: 1,
        name: "Development",
        slug: "development",
      },
      auth: "No",
      cors: "Yes",
      https: true,
      healthStatus: "live",
    },
    locale: "en",
  };

  it("should generate valid BreadcrumbList schema", () => {
    const schema = generator.generate(mockContext);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toBeDefined();
  });

  it("should include home breadcrumb", () => {
    const schema = generator.generate(mockContext);

    const homeItem = schema.itemListElement.find(
      (item: { position: number }) => item.position === 1,
    );
    expect(homeItem).toBeDefined();
    expect(homeItem.name).toBe("Home");
  });

  it("should include category breadcrumb", () => {
    const schema = generator.generate(mockContext);

    const categoryItem = schema.itemListElement.find(
      (item: { name: string }) => item.name === "Development",
    );
    expect(categoryItem).toBeDefined();
  });

  it("should include API breadcrumb", () => {
    const schema = generator.generate(mockContext);

    const apiItem = schema.itemListElement.find(
      (item: { name: string }) => item.name === "Test API",
    );
    expect(apiItem).toBeDefined();
  });
});

describe("SchemaManager", () => {
  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "Test",
      link: "https://api.example.com",
      auth: "No",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      generatedContent: {
        blogPost: "Content",
      },
    },
    locale: "en",
  };

  const faqItems: FAQItem[] = [
    {
      question: "Test question?",
      answer: "Test answer",
      category: "general",
    },
  ];

  it("should generate all schemas", () => {
    const schemas = schemaManager.generateAll(mockContext, faqItems);

    expect(schemas.length).toBeGreaterThan(5);
  });

  it("should include WebAPI schema", () => {
    const schemas = schemaManager.generateAll(mockContext);

    const webApiSchema = schemas.find((s) => s["@type"] === "WebAPI");
    expect(webApiSchema).toBeDefined();
  });

  it("should include BreadcrumbList schema", () => {
    const schemas = schemaManager.generateAll(mockContext);

    const breadcrumbSchema = schemas.find(
      (s) => s["@type"] === "BreadcrumbList",
    );
    expect(breadcrumbSchema).toBeDefined();
  });

  it("should include FAQPage schema when FAQ items provided", () => {
    const schemas = schemaManager.generateAll(mockContext, faqItems);

    const faqSchema = schemas.find((s) => s["@type"] === "FAQPage");
    expect(faqSchema).toBeDefined();
  });

  it("should include Article schema when blog post exists", () => {
    const schemas = schemaManager.generateAll(mockContext);

    const articleSchema = schemas.find((s) => s["@type"] === "Article");
    expect(articleSchema).toBeDefined();
  });
});
