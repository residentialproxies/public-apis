/**
 * Unit tests for PSEO Content Generators
 */

import { describe, it, expect } from "vitest";
import {
  GettingStartedGenerator,
  CodeExamplesGenerator,
  FAQGenerator,
} from "../pseo-generators";
import type { TemplateContext } from "../pseo-templates";

describe("GettingStartedGenerator", () => {
  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "A comprehensive test API for developers",
      link: "https://api.example.com",
      auth: "apiKey",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      latencyMs: 120,
    },
    locale: "en",
  };

  it("should generate getting started content", () => {
    const generator = new GettingStartedGenerator();
    const content = generator.generate(mockContext);

    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it("should include API description in first paragraph", () => {
    const generator = new GettingStartedGenerator();
    const content = generator.generate(mockContext);

    const firstParagraph = content.find((node) => node.type === "paragraph");
    expect(firstParagraph).toBeDefined();
    expect(firstParagraph?.type).toBe("paragraph");
    if (firstParagraph?.type === "paragraph") {
      expect(firstParagraph.text).toContain("Test API");
      expect(firstParagraph.text).toContain("A comprehensive test API");
    }
  });

  it("should include quick info list", () => {
    const generator = new GettingStartedGenerator();
    const content = generator.generate(mockContext);

    const list = content.find((node) => node.type === "list");
    expect(list).toBeDefined();
    expect(list?.type).toBe("list");
    if (list?.type === "list") {
      expect(list.items.length).toBeGreaterThan(0);
    }
  });

  it("should include curl code example", () => {
    const generator = new GettingStartedGenerator();
    const content = generator.generate(mockContext);

    const codeBlock = content.find((node) => node.type === "code_block");
    expect(codeBlock).toBeDefined();
    expect(codeBlock?.type).toBe("code_block");
    if (codeBlock?.type === "code_block") {
      expect(codeBlock.language).toBe("bash");
      expect(codeBlock.code).toContain("curl");
    }
  });

  it("should include authentication guide for authenticated APIs", () => {
    const generator = new GettingStartedGenerator();
    const content = generator.generate(mockContext);

    const authHeading = content.find(
      (node) => node.type === "heading" && node.text === "Authentication",
    );
    expect(authHeading).toBeDefined();
  });

  it("should not include authentication guide for public APIs", () => {
    const publicContext: TemplateContext = {
      ...mockContext,
      api: { ...mockContext.api, auth: "No" },
    };

    const generator = new GettingStartedGenerator();
    const content = generator.generate(publicContext);

    const authHeading = content.find(
      (node) => node.type === "heading" && node.text === "Authentication",
    );
    expect(authHeading).toBeUndefined();
  });
});

describe("CodeExamplesGenerator", () => {
  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "A test API",
      link: "https://api.example.com/v1",
      auth: "apiKey",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      seoMetadata: {
        languages: [{ language: "JavaScript" }, { language: "Python" }],
        hasCodeExamples: true,
      },
    },
    locale: "en",
  };

  it("should generate code examples", () => {
    const generator = new CodeExamplesGenerator();
    const content = generator.generate(mockContext);

    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it("should generate examples for documented languages", () => {
    const generator = new CodeExamplesGenerator();
    const content = generator.generate(mockContext);

    const jsHeading = content.find(
      (node) => node.type === "heading" && node.text === "JavaScript",
    );
    const pythonHeading = content.find(
      (node) => node.type === "heading" && node.text === "Python",
    );

    expect(jsHeading).toBeDefined();
    expect(pythonHeading).toBeDefined();
  });

  it("should include code blocks for each language", () => {
    const generator = new CodeExamplesGenerator();
    const content = generator.generate(mockContext);

    const codeBlocks = content.filter((node) => node.type === "code_block");
    expect(codeBlocks.length).toBeGreaterThan(0);
  });

  it("should include authentication in code examples", () => {
    const generator = new CodeExamplesGenerator();
    const content = generator.generate(mockContext);

    const codeBlocks = content.filter((node) => node.type === "code_block");
    const hasAuth = codeBlocks.some((block) => {
      if (block.type === "code_block") {
        return (
          block.code.includes("Authorization") || block.code.includes("apiKey")
        );
      }
      return false;
    });

    expect(hasAuth).toBe(true);
  });

  it("should not include authentication for public APIs", () => {
    const publicContext: TemplateContext = {
      ...mockContext,
      api: { ...mockContext.api, auth: "No" },
    };

    const generator = new CodeExamplesGenerator();
    const content = generator.generate(publicContext);

    const codeBlocks = content.filter((node) => node.type === "code_block");
    const hasAuth = codeBlocks.some((block) => {
      if (block.type === "code_block") {
        return block.code.includes("Authorization");
      }
      return false;
    });

    expect(hasAuth).toBe(false);
  });
});

describe("FAQGenerator", () => {
  const mockContext: TemplateContext = {
    api: {
      id: 1,
      name: "Test API",
      description: "A test API",
      link: "https://api.example.com",
      auth: "apiKey",
      cors: "Yes",
      https: true,
      healthStatus: "live",
      latencyMs: 250,
      openapiUrl: "https://api.example.com/openapi.json",
      seoMetadata: {
        docQualityScore: 8,
        hasCodeExamples: true,
        languages: [{ language: "JavaScript" }, { language: "Python" }],
      },
      aiAnalysis: {
        summary: "A powerful API for testing purposes",
        useCases: [
          { tag: "testing" },
          { tag: "development" },
          { tag: "automation" },
        ],
      },
    },
    healthSummary: {
      uptimePct: 99.5,
      avgLatencyMs: 200,
    },
    locale: "en",
  };

  it("should generate FAQ items", () => {
    const generator = new FAQGenerator();
    const content = generator.generate(mockContext);

    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it("should include authentication FAQ", () => {
    const generator = new FAQGenerator();
    const content = generator.generate(mockContext);

    const authQuestion = content.some((node) => {
      if (node.type === "heading") {
        return node.text.toLowerCase().includes("authenticate");
      }
      return false;
    });

    expect(authQuestion).toBe(true);
  });

  it("should include CORS FAQ for CORS-enabled APIs", () => {
    const generator = new FAQGenerator();
    const content = generator.generate(mockContext);

    const corsQuestion = content.some((node) => {
      if (node.type === "heading") {
        return node.text.toLowerCase().includes("browser");
      }
      return false;
    });

    expect(corsQuestion).toBe(true);
  });

  it("should include performance FAQ when latency data exists", () => {
    const generator = new FAQGenerator();
    const content = generator.generate(mockContext);

    const perfQuestion = content.some((node) => {
      if (node.type === "heading") {
        return node.text.toLowerCase().includes("response time");
      }
      return false;
    });

    expect(perfQuestion).toBe(true);
  });

  it("should include reliability FAQ when uptime data exists", () => {
    const generator = new FAQGenerator();
    const content = generator.generate(mockContext);

    const reliabilityQuestion = content.some((node) => {
      if (node.type === "heading") {
        return node.text.toLowerCase().includes("reliable");
      }
      return false;
    });

    expect(reliabilityQuestion).toBe(true);
  });

  it("should include documentation FAQ for high-quality docs", () => {
    const generator = new FAQGenerator();
    const content = generator.generate(mockContext);

    const docQuestion = content.some((node) => {
      if (node.type === "heading") {
        return node.text.toLowerCase().includes("documentation");
      }
      return false;
    });

    expect(docQuestion).toBe(true);
  });

  it("should include OpenAPI FAQ when spec exists", () => {
    const generator = new FAQGenerator();
    const content = generator.generate(mockContext);

    const openapiQuestion = content.some((node) => {
      if (node.type === "heading") {
        return (
          node.text.toLowerCase().includes("openapi") ||
          node.text.toLowerCase().includes("swagger")
        );
      }
      return false;
    });

    expect(openapiQuestion).toBe(true);
  });

  it("should include use cases FAQ when AI analysis exists", () => {
    const generator = new FAQGenerator();
    const content = generator.generate(mockContext);

    const useCaseQuestion = content.some((node) => {
      if (node.type === "heading") {
        return node.text.toLowerCase().includes("build");
      }
      return false;
    });

    expect(useCaseQuestion).toBe(true);
  });

  it("should organize content by category headings", () => {
    const generator = new FAQGenerator();
    const content = generator.generate(mockContext);

    const categoryHeadings = content.filter(
      (node) => node.type === "heading" && node.level === 3,
    );

    expect(categoryHeadings.length).toBeGreaterThan(0);
  });
});
