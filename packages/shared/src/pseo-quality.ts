/**
 * Content Quality Scoring System
 * Evaluates and scores API detail page content completeness
 */

import { TemplateContext, ContentQualityScore, ContentQualityBreakdown } from "./pseo-templates";

export type QualityDimension = keyof ContentQualityBreakdown;

export type ScoreWeight = {
  dimension: QualityDimension;
  weight: number; // Percentage of total score
  maxScore: number;
};

export const SCORE_WEIGHTS: ScoreWeight[] = [
  { dimension: "basicInfo", weight: 0.2, maxScore: 20 },
  { dimension: "technicalDocs", weight: 0.25, maxScore: 25 },
  { dimension: "codeExamples", weight: 0.2, maxScore: 20 },
  { dimension: "seoOptimization", weight: 0.2, maxScore: 20 },
  { dimension: "userGuidance", weight: 0.15, maxScore: 15 },
];

export class ContentQualityScorer {
  /**
   * Calculate overall content quality score
   */
  calculateScore(ctx: TemplateContext): ContentQualityScore {
    const breakdown: ContentQualityBreakdown = {
      basicInfo: this.scoreBasicInfo(ctx),
      technicalDocs: this.scoreTechnicalDocs(ctx),
      codeExamples: this.scoreCodeExamples(ctx),
      seoOptimization: this.scoreSEOOptimization(ctx),
      userGuidance: this.scoreUserGuidance(ctx),
    };

    const overall = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

    const recommendations = this.generateRecommendations(ctx, breakdown);

    return {
      overall,
      breakdown,
      recommendations,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Score: Basic Information (0-20)
   */
  private scoreBasicInfo(ctx: TemplateContext): number {
    const { api } = ctx;
    let score = 0;

    // Name and description (mandatory) - 10 points
    score += 10;

    // Category - 5 points
    if (api.category) score += 5;

    // Valid link - 5 points
    if (api.link && this.isValidUrl(api.link)) score += 5;

    return Math.min(score, 20);
  }

  /**
   * Score: Technical Documentation (0-25)
   */
  private scoreTechnicalDocs(ctx: TemplateContext): number {
    const { api } = ctx;
    let score = 0;

    // OpenAPI specification - 10 points
    if (api.openapiUrl && this.isValidUrl(api.openapiUrl)) {
      score += 10;
    }

    // Documentation quality score - 15 points (scaled)
    if (api.seoMetadata?.docQualityScore !== null && api.seoMetadata?.docQualityScore !== undefined) {
      score += Math.min(15, api.seoMetadata.docQualityScore * 1.5);
    }

    return Math.min(score, 25);
  }

  /**
   * Score: Code Examples (0-20)
   */
  private scoreCodeExamples(ctx: TemplateContext): number {
    const { api } = ctx;
    let score = 0;

    // Has code examples - 10 points
    if (api.seoMetadata?.hasCodeExamples) {
      score += 10;
    }

    // Multiple programming languages - up to 10 points
    const langCount = api.seoMetadata?.languages?.length || 0;
    score += Math.min(10, langCount * 2);

    return Math.min(score, 20);
  }

  /**
   * Score: SEO Optimization (0-20)
   */
  private scoreSEOOptimization(ctx: TemplateContext): number {
    const { api } = ctx;
    let score = 0;

    // SEO title - 5 points
    if (api.generatedContent?.seoTitle?.trim()) {
      score += 5;
    }

    // Generated blog post content - 5 points
    if (api.generatedContent?.blogPost?.trim()) {
      score += 5;
    }

    // Keywords - up to 5 points
    const keywordCount = api.seoMetadata?.keywords?.length || 0;
    score += Math.min(5, keywordCount / 2);

    // Structured headings (H2s) - up to 5 points
    const h2Count = api.seoMetadata?.h2s?.length || 0;
    score += Math.min(5, h2Count / 3);

    return Math.min(score, 20);
  }

  /**
   * Score: User Guidance (0-15)
   */
  private scoreUserGuidance(ctx: TemplateContext): number {
    const { api } = ctx;
    let score = 0;

    // AI summary - 5 points
    if (api.aiAnalysis?.summary?.trim()) {
      score += 5;
    }

    // Use cases - up to 10 points
    const useCaseCount = api.aiAnalysis?.useCases?.length || 0;
    score += Math.min(10, useCaseCount * 2);

    return Math.min(score, 15);
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    ctx: TemplateContext,
    breakdown: ContentQualityBreakdown
  ): string[] {
    const { api } = ctx;
    const recommendations: string[] = [];

    // Basic Info recommendations
    if (breakdown.basicInfo < 15) {
      if (!api.category) {
        recommendations.push("Assign a category to improve discoverability");
      }
    }

    // Technical Docs recommendations
    if (breakdown.technicalDocs < 20) {
      if (!api.openapiUrl) {
        recommendations.push(
          "Add OpenAPI specification URL to enable API reference documentation"
        );
      }
      if (
        !api.seoMetadata?.docQualityScore ||
        api.seoMetadata.docQualityScore < 7
      ) {
        recommendations.push(
          "Run SEO extraction job to analyze documentation quality"
        );
      }
    }

    // Code Examples recommendations
    if (breakdown.codeExamples < 15) {
      if (!api.seoMetadata?.hasCodeExamples) {
        recommendations.push("Add code examples to documentation to improve developer experience");
      }
      const langCount = api.seoMetadata?.languages?.length || 0;
      if (langCount < 3) {
        recommendations.push(
          `Increase language coverage (currently ${langCount}) - add examples for JavaScript, Python, cURL`
        );
      }
    }

    // SEO Optimization recommendations
    if (breakdown.seoOptimization < 15) {
      if (!api.generatedContent?.seoTitle) {
        recommendations.push("Generate SEO-optimized title for better search visibility");
      }
      if (!api.generatedContent?.blogPost) {
        recommendations.push(
          "Generate long-form content (blog post) to increase page depth and SEO value"
        );
      }
      const keywordCount = api.seoMetadata?.keywords?.length || 0;
      if (keywordCount < 5) {
        recommendations.push(
          `Add more relevant keywords (currently ${keywordCount}) for better search coverage`
        );
      }
    }

    // User Guidance recommendations
    if (breakdown.userGuidance < 10) {
      if (!api.aiAnalysis?.summary) {
        recommendations.push("Add AI-generated summary to help users understand API value");
      }
      const useCaseCount = api.aiAnalysis?.useCases?.length || 0;
      if (useCaseCount < 3) {
        recommendations.push(
          `Add more use cases (currently ${useCaseCount}) to demonstrate API applications`
        );
      }
    }

    return recommendations;
  }

  /**
   * Get quality grade (A-F)
   */
  getGrade(score: number): string {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "A-";
    if (score >= 75) return "B+";
    if (score >= 70) return "B";
    if (score >= 65) return "B-";
    if (score >= 60) return "C+";
    if (score >= 55) return "C";
    if (score >= 50) return "C-";
    if (score >= 45) return "D+";
    if (score >= 40) return "D";
    return "F";
  }

  /**
   * Get quality status
   */
  getStatus(score: number): "excellent" | "good" | "fair" | "poor" {
    if (score >= 80) return "excellent";
    if (score >= 65) return "good";
    if (score >= 50) return "fair";
    return "poor";
  }

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      if (typeof URL === "undefined") return false;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// ==================== Content Completeness Analyzer ====================
export class ContentCompletenessAnalyzer {
  /**
   * Analyze which content blocks should be shown
   */
  analyzeCompleteness(ctx: TemplateContext): {
    availableBlocks: string[];
    missingBlocks: string[];
    completeness: number; // 0-100%
  } {
    const available: string[] = [];
    const missing: string[] = [];

    // Check Getting Started
    if (ctx.api.link) {
      available.push("getting_started");
    }

    // Check Code Examples
    if (
      ctx.api.seoMetadata?.hasCodeExamples ||
      ctx.api.seoMetadata?.languages?.length
    ) {
      available.push("code_examples");
    } else {
      missing.push("code_examples");
    }

    // Check API Reference
    if (ctx.api.openapiUrl) {
      available.push("api_reference");
    } else {
      missing.push("api_reference");
    }

    // Check FAQ
    // FAQ is always generated dynamically
    available.push("faq");

    // Check Use Cases
    if (ctx.api.aiAnalysis?.useCases?.length) {
      available.push("use_cases");
    } else {
      missing.push("use_cases");
    }

    // Check Performance Data
    if (ctx.healthSummary?.series?.length) {
      available.push("performance_chart");
    } else {
      missing.push("performance_chart");
    }

    // Check Screenshot
    if (ctx.api.screenshot?.thumbnailUrl) {
      available.push("screenshot");
    } else {
      missing.push("screenshot");
    }

    // Check Generated Content
    if (ctx.api.generatedContent?.blogPost) {
      available.push("deep_dive_article");
    } else {
      missing.push("deep_dive_article");
    }

    // Check Related APIs
    if (ctx.relatedApis?.length) {
      available.push("related_apis");
    } else {
      missing.push("related_apis");
    }

    const total = available.length + missing.length;
    const completeness = total > 0 ? (available.length / total) * 100 : 0;

    return {
      availableBlocks: available,
      missingBlocks: missing,
      completeness,
    };
  }
}

// ==================== SEO Score Calculator ====================
export class SEOScoreCalculator {
  /**
   * Calculate SEO score based on multiple factors
   */
  calculateSEOScore(ctx: TemplateContext): {
    overall: number; // 0-100
    factors: {
      titleOptimization: number;
      metaDescription: number;
      contentLength: number;
      keywordDensity: number;
      structuredData: number;
      internalLinks: number;
      imageOptimization: number;
      mobileOptimization: number;
    };
  } {
    const factors = {
      titleOptimization: this.scoreTitleOptimization(ctx),
      metaDescription: this.scoreMetaDescription(ctx),
      contentLength: this.scoreContentLength(ctx),
      keywordDensity: this.scoreKeywordDensity(ctx),
      structuredData: this.scoreStructuredData(ctx),
      internalLinks: this.scoreInternalLinks(ctx),
      imageOptimization: this.scoreImageOptimization(ctx),
      mobileOptimization: this.scoreMobileOptimization(ctx),
    };

    const weights = {
      titleOptimization: 0.15,
      metaDescription: 0.1,
      contentLength: 0.2,
      keywordDensity: 0.1,
      structuredData: 0.15,
      internalLinks: 0.1,
      imageOptimization: 0.1,
      mobileOptimization: 0.1,
    };

    const overall = Object.entries(factors).reduce(
      (sum, [key, score]) => sum + score * weights[key as keyof typeof weights],
      0
    );

    return { overall, factors };
  }

  private scoreTitleOptimization(ctx: TemplateContext): number {
    const title = ctx.api.generatedContent?.seoTitle || ctx.api.name;
    let score = 0;

    // Title exists - 30 points
    score += 30;

    // Optimal length (50-60 chars) - 40 points
    if (title.length >= 50 && title.length <= 60) {
      score += 40;
    } else if (title.length >= 40 && title.length <= 70) {
      score += 25;
    }

    // Contains API name - 30 points
    if (title.toLowerCase().includes(ctx.api.name.toLowerCase())) {
      score += 30;
    }

    return Math.min(score, 100);
  }

  private scoreMetaDescription(ctx: TemplateContext): number {
    const desc = ctx.api.seoMetadata?.description || ctx.api.description;
    let score = 0;

    // Description exists - 40 points
    score += 40;

    // Optimal length (150-160 chars) - 60 points
    if (desc.length >= 150 && desc.length <= 160) {
      score += 60;
    } else if (desc.length >= 120 && desc.length <= 180) {
      score += 40;
    }

    return Math.min(score, 100);
  }

  private scoreContentLength(ctx: TemplateContext): number {
    const blogPost = ctx.api.generatedContent?.blogPost || "";
    const wordCount = blogPost.split(/\s+/).length;

    // Score based on word count
    if (wordCount >= 1500) return 100;
    if (wordCount >= 1000) return 80;
    if (wordCount >= 500) return 60;
    if (wordCount >= 300) return 40;
    return 20;
  }

  private scoreKeywordDensity(ctx: TemplateContext): number {
    const keywords = ctx.api.seoMetadata?.keywords?.length || 0;

    // Score based on keyword count
    if (keywords >= 10) return 100;
    if (keywords >= 7) return 80;
    if (keywords >= 5) return 60;
    if (keywords >= 3) return 40;
    return 20;
  }

  private scoreStructuredData(ctx: TemplateContext): number {
    let score = 0;

    // Has WebAPI schema - 25 points
    score += 25;

    // Has FAQ data - 25 points
    // FAQ is generated dynamically
    score += 25;

    // Has Breadcrumb - 20 points
    if (ctx.api.category) score += 20;

    // Has HowTo steps - 15 points
    if (ctx.api.seoMetadata?.hasCodeExamples) score += 15;

    // Has Article schema (for blog post) - 15 points
    if (ctx.api.generatedContent?.blogPost) score += 15;

    return Math.min(score, 100);
  }

  private scoreInternalLinks(ctx: TemplateContext): number {
    let linkCount = 0;

    // Category link
    if (ctx.api.category) linkCount++;

    // Related APIs
    linkCount += ctx.relatedApis?.length || 0;

    // Score based on internal links
    if (linkCount >= 8) return 100;
    if (linkCount >= 5) return 80;
    if (linkCount >= 3) return 60;
    if (linkCount >= 1) return 40;
    return 0;
  }

  private scoreImageOptimization(ctx: TemplateContext): number {
    let score = 0;

    // Has screenshot - 60 points
    if (ctx.api.screenshot?.thumbnailUrl) {
      score += 60;
    }

    // Has OG image - 40 points
    if (ctx.api.seoMetadata?.ogImage) {
      score += 40;
    }

    return Math.min(score, 100);
  }

  private scoreMobileOptimization(ctx: TemplateContext): number {
    // This is a static score as mobile optimization depends on frontend implementation
    // Assume responsive design is implemented
    return 100;
  }
}

// ==================== Export ====================
export const qualityScorer = new ContentQualityScorer();
export const completenessAnalyzer = new ContentCompletenessAnalyzer();
export const seoScoreCalculator = new SEOScoreCalculator();
