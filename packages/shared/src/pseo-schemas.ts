/**
 * Schema.org Structured Data Enhancement
 * Rich snippets and structured data generators for SEO
 */

import { TemplateContext, FAQItem } from "./pseo-templates";

export type SchemaType =
  | "WebAPI"
  | "SoftwareApplication"
  | "FAQPage"
  | "HowTo"
  | "Article"
  | "BreadcrumbList"
  | "Organization"
  | "Product"
  | "Review";

export type SchemaContext = {
  "@context": string;
  "@type": SchemaType | SchemaType[];
  [key: string]: unknown;
};

// ==================== Schema Generator Base ====================
export abstract class SchemaGenerator {
  protected readonly context = "https://schema.org";

  abstract generate(ctx: TemplateContext, ...args: unknown[]): SchemaContext;

  protected getSiteUrl(): string {
    return (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SITE_URL) || "https://api-navigator.com";
  }
}

// ==================== WebAPI Schema ====================
export class WebAPISchema extends SchemaGenerator {
  generate(ctx: TemplateContext): SchemaContext {
    const { api } = ctx;
    const siteUrl = this.getSiteUrl();

    return {
      "@context": this.context,
      "@type": "WebAPI",
      name: api.name,
      description: api.aiAnalysis?.summary || api.description,
      url: `${siteUrl}/api/${api.id}/${this.slugify(api.name)}`,
      documentation: api.openapiUrl || api.link,
      provider: {
        "@type": "Organization",
        name: this.extractProviderName(api.link),
        url: this.extractBaseUrl(api.link),
      },
      termsOfService: api.link,
      ...(api.aiAnalysis?.useCases && {
        applicationCategory: api.aiAnalysis.useCases.map((u) => u.tag).join(", "),
      }),
      ...(api.seoMetadata?.keywords && {
        keywords: api.seoMetadata.keywords.map((k) => k.keyword).join(", "),
      }),
      ...(api.seoMetadata?.languages && {
        programmingLanguage: api.seoMetadata.languages.map((l) => l.language),
      }),
      additionalProperty: this.getAdditionalProperties(ctx),
    };
  }

  private getAdditionalProperties(ctx: TemplateContext): Array<{
    "@type": string;
    name: string;
    value: string | number;
  }> {
    const { api, healthSummary } = ctx;
    const properties: Array<{ "@type": string; name: string; value: string | number }> = [];

    properties.push(
      { "@type": "PropertyValue", name: "Authentication", value: api.auth },
      { "@type": "PropertyValue", name: "CORS", value: api.cors },
      { "@type": "PropertyValue", name: "HTTPS", value: api.https ? "Yes" : "No" }
    );

    if (api.seoMetadata?.docQualityScore) {
      properties.push({
        "@type": "PropertyValue",
        name: "Documentation Quality",
        value: `${api.seoMetadata.docQualityScore}/10`,
      });
    }

    if (api.seoMetadata?.hasCodeExamples) {
      properties.push({
        "@type": "PropertyValue",
        name: "Code Examples",
        value: "Yes",
      });
    }

    if (healthSummary?.uptimePct !== null && healthSummary?.uptimePct !== undefined) {
      properties.push({
        "@type": "PropertyValue",
        name: "Uptime (30d)",
        value: `${healthSummary.uptimePct.toFixed(2)}%`,
      });
    }

    if (healthSummary?.avgLatencyMs !== null && healthSummary?.avgLatencyMs !== undefined) {
      properties.push({
        "@type": "PropertyValue",
        name: "Average Latency",
        value: `${healthSummary.avgLatencyMs}ms`,
      });
    }

    return properties;
  }

  private extractProviderName(url: string): string {
    try {
      if (typeof URL === "undefined") return "API Provider";
      const hostname = new URL(url).hostname;
      const parts = hostname.split(".");
      // Get domain name without TLD
      return parts.length > 1 ? parts[parts.length - 2] : hostname;
    } catch {
      return "API Provider";
    }
  }

  private extractBaseUrl(url: string): string {
    try {
      if (typeof URL === "undefined") return url;
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return url;
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

// ==================== SoftwareApplication Schema ====================
export class SoftwareApplicationSchema extends SchemaGenerator {
  generate(ctx: TemplateContext): SchemaContext {
    const { api } = ctx;

    return {
      "@context": this.context,
      "@type": "SoftwareApplication",
      name: api.name,
      description: api.aiAnalysis?.summary || api.description,
      url: api.link,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web API",
      offers: {
        "@type": "Offer",
        ...(api.auth === "No" && {
          price: "0",
          priceCurrency: "USD",
        }),
      },
      ...(api.seoMetadata?.docQualityScore && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: api.seoMetadata.docQualityScore,
          bestRating: 10,
          worstRating: 1,
          ratingCount: 1,
        },
      }),
      ...(api.screenshot?.fullUrl && {
        screenshot: api.screenshot.fullUrl,
      }),
    };
  }
}

// ==================== FAQ Schema ====================
export class FAQSchema extends SchemaGenerator {
  generate(ctx: TemplateContext, faqItems: FAQItem[]): SchemaContext {
    return {
      "@context": this.context,
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };
  }
}

// ==================== HowTo Schema ====================
export class HowToSchema extends SchemaGenerator {
  generate(ctx: TemplateContext): SchemaContext {
    const { api } = ctx;

    return {
      "@context": this.context,
      "@type": "HowTo",
      name: `How to use ${api.name} API`,
      description: `Step-by-step guide to integrate and use the ${api.name} API in your application`,
      step: this.generateHowToSteps(ctx),
      totalTime: "PT10M", // Estimated 10 minutes
      tool: [
        {
          "@type": "HowToTool",
          name: api.auth === "No" ? "No API Key Required" : `${api.auth} Authentication`,
        },
        ...(api.https
          ? [
              {
                "@type": "HowToTool",
                name: "HTTPS Connection",
              },
            ]
          : []),
      ],
    };
  }

  private generateHowToSteps(ctx: TemplateContext): Array<{
    "@type": string;
    name: string;
    text: string;
    url?: string;
  }> {
    const { api } = ctx;
    const steps: Array<{ "@type": string; name: string; text: string; url?: string }> = [];

    // Step 1: Registration (if auth required)
    if (api.auth !== "No") {
      steps.push({
        "@type": "HowToStep",
        name: "Register for API Access",
        text: `Visit ${api.link} and sign up to obtain your API credentials (${api.auth}).`,
        url: api.link,
      });
    }

    // Step 2: Review Documentation
    steps.push({
      "@type": "HowToStep",
      name: "Review API Documentation",
      text: `Read the official documentation at ${
        api.openapiUrl || api.link
      } to understand available endpoints and parameters.`,
      url: api.openapiUrl || api.link,
    });

    // Step 3: Make Your First Request
    const baseUrl = this.extractBaseUrl(api.link);
    steps.push({
      "@type": "HowToStep",
      name: "Make Your First API Request",
      text: `Send a test request to ${baseUrl} using your preferred HTTP client${
        api.auth !== "No" ? ", including your authentication credentials" : ""
      }.`,
    });

    // Step 4: Handle Response
    steps.push({
      "@type": "HowToStep",
      name: "Process the API Response",
      text: `Parse the JSON response and handle any errors appropriately. Implement retry logic for production use.`,
    });

    // Step 5: Integrate (if has code examples)
    if (api.seoMetadata?.hasCodeExamples) {
      steps.push({
        "@type": "HowToStep",
        name: "Integrate into Your Application",
        text: `Use the provided code examples${
          api.seoMetadata.languages
            ? ` in ${api.seoMetadata.languages.map((l) => l.language).join(", ")}`
            : ""
        } to integrate the API into your application.`,
      });
    }

    return steps;
  }

  private extractBaseUrl(url: string): string {
    try {
      if (typeof URL === "undefined") return url;
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return url;
    }
  }
}

// ==================== Article Schema (for Generated Content) ====================
export class ArticleSchema extends SchemaGenerator {
  generate(ctx: TemplateContext): SchemaContext {
    const { api } = ctx;
    const siteUrl = this.getSiteUrl();

    return {
      "@context": this.context,
      "@type": "Article",
      headline: api.generatedContent?.seoTitle || `${api.name} API Guide`,
      description: api.aiAnalysis?.summary || api.description,
      author: {
        "@type": "Organization",
        name: "API Navigator",
        url: siteUrl,
      },
      publisher: {
        "@type": "Organization",
        name: "API Navigator",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/logo.png`,
        },
      },
      datePublished: api.generatedContent?.lastGeneratedAt || new Date().toISOString(),
      dateModified: api.generatedContent?.lastGeneratedAt || new Date().toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${siteUrl}/api/${api.id}/${this.slugify(api.name)}`,
      },
      ...(api.screenshot?.fullUrl && {
        image: [api.screenshot.fullUrl],
      }),
    };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

// ==================== BreadcrumbList Schema ====================
export class BreadcrumbListSchema extends SchemaGenerator {
  generate(ctx: TemplateContext): SchemaContext {
    const { api } = ctx;
    const siteUrl = this.getSiteUrl();

    const items: Array<{
      "@type": string;
      position: number;
      name: string;
      item: string;
    }> = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
    ];

    if (api.category) {
      items.push({
        "@type": "ListItem",
        position: 2,
        name: api.category.name,
        item: `${siteUrl}/category/${api.category.slug}`,
      });
    }

    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: api.name,
      item: `${siteUrl}/api/${api.id}/${this.slugify(api.name)}`,
    });

    return {
      "@context": this.context,
      "@type": "BreadcrumbList",
      itemListElement: items,
    };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

// ==================== Product Schema (for API as Product) ====================
export class ProductSchema extends SchemaGenerator {
  generate(ctx: TemplateContext): SchemaContext {
    const { api, healthSummary } = ctx;
    const siteUrl = this.getSiteUrl();

    return {
      "@context": this.context,
      "@type": "Product",
      name: api.name,
      description: api.aiAnalysis?.summary || api.description,
      url: `${siteUrl}/api/${api.id}/${this.slugify(api.name)}`,
      ...(api.screenshot?.fullUrl && {
        image: [api.screenshot.fullUrl],
      }),
      brand: {
        "@type": "Brand",
        name: this.extractProviderName(api.link),
      },
      offers: {
        "@type": "Offer",
        url: api.link,
        ...(api.auth === "No" && {
          price: "0",
          priceCurrency: "USD",
        }),
        availability: "https://schema.org/InStock",
      },
      ...(api.seoMetadata?.docQualityScore && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: api.seoMetadata.docQualityScore,
          bestRating: 10,
          worstRating: 1,
          ratingCount: 1,
        },
      }),
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "API Type",
          value: "REST API",
        },
        {
          "@type": "PropertyValue",
          name: "Authentication",
          value: api.auth,
        },
        ...(healthSummary?.uptimePct
          ? [
              {
                "@type": "PropertyValue",
                name: "Uptime",
                value: `${healthSummary.uptimePct.toFixed(2)}%`,
              },
            ]
          : []),
      ],
    };
  }

  private extractProviderName(url: string): string {
    try {
      if (typeof URL === "undefined") return "API Provider";
      const hostname = new URL(url).hostname;
      const parts = hostname.split(".");
      return parts.length > 1 ? parts[parts.length - 2] : hostname;
    } catch {
      return "API Provider";
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

// ==================== Schema Manager ====================
export class SchemaManager {
  private generators: Map<SchemaType, SchemaGenerator>;

  constructor() {
    this.generators = new Map([
      ["WebAPI", new WebAPISchema()],
      ["SoftwareApplication", new SoftwareApplicationSchema()],
      ["FAQPage", new FAQSchema()],
      ["HowTo", new HowToSchema()],
      ["Article", new ArticleSchema()],
      ["BreadcrumbList", new BreadcrumbListSchema()],
      ["Product", new ProductSchema()],
    ]);
  }

  generate(type: SchemaType, ctx: TemplateContext, ...args: unknown[]): SchemaContext {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`Schema generator not found for type: ${type}`);
    }

    return generator.generate(ctx, ...args);
  }

  generateAll(ctx: TemplateContext, faqItems?: FAQItem[]): SchemaContext[] {
    const schemas: SchemaContext[] = [];

    // Always include WebAPI schema
    schemas.push(this.generate("WebAPI", ctx));

    // Always include Breadcrumb
    schemas.push(this.generate("BreadcrumbList", ctx));

    // Include SoftwareApplication schema
    schemas.push(this.generate("SoftwareApplication", ctx));

    // Include Product schema
    schemas.push(this.generate("Product", ctx));

    // Include HowTo schema
    schemas.push(this.generate("HowTo", ctx));

    // Include FAQ if items provided
    if (faqItems && faqItems.length > 0) {
      schemas.push(this.generate("FAQPage", ctx, faqItems));
    }

    // Include Article if generated content exists
    if (ctx.api.generatedContent?.blogPost) {
      schemas.push(this.generate("Article", ctx));
    }

    return schemas;
  }
}

// ==================== Export ====================
export const schemaManager = new SchemaManager();
