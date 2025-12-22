/**
 * Programmatic SEO Template System
 * Type definitions for dynamic content blocks and templates
 */

export enum BlockType {
  // 基础信息块
  HERO = "hero",
  QUICK_STATS = "quick_stats",

  // 技术文档块
  GETTING_STARTED = "getting_started",
  CODE_EXAMPLES = "code_examples",
  API_REFERENCE = "api_reference",
  AUTHENTICATION_GUIDE = "auth_guide",

  // 比较与分析块
  ALTERNATIVES = "alternatives",
  PRICING_COMPARISON = "pricing_comparison",
  FEATURE_MATRIX = "feature_matrix",

  // 使用场景块
  USE_CASES = "use_cases",
  INDUSTRY_EXAMPLES = "industry_examples",
  SUCCESS_STORIES = "success_stories",

  // 技术规格块
  RATE_LIMITS = "rate_limits",
  DATA_FORMATS = "data_formats",
  SUPPORTED_REGIONS = "supported_regions",

  // 社区与支持块
  COMMUNITY_RESOURCES = "community",
  CHANGELOG = "changelog",
  ROADMAP = "roadmap",

  // SEO 增强块
  FAQ = "faq",
  GLOSSARY = "glossary",
  RELATED_APIS = "related_apis",
  CATEGORY_OVERVIEW = "category_overview",
}

export type RenderConditionOperator = "exists" | "equals" | "gt" | "lt" | "contains" | "in";

export type RenderCondition = {
  field: string;
  operator: RenderConditionOperator;
  value?: unknown;
};

export type ContentBlock = {
  id: string;
  type: BlockType;
  priority: number; // 1-10, 数字越大优先级越高
  conditions: RenderCondition[];
  seoWeight: number; // 0-10, SEO 权重
  enabled: boolean;
};

// 内容节点类型
export type ContentNodeType =
  | "heading"
  | "paragraph"
  | "code_block"
  | "list"
  | "table"
  | "quote"
  | "image"
  | "link"
  | "component";

export type ContentNode =
  | HeadingNode
  | ParagraphNode
  | CodeBlockNode
  | ListNode
  | TableNode
  | QuoteNode
  | ImageNode
  | LinkNode
  | ComponentNode;

export type HeadingNode = {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string; // for anchor links
};

export type ParagraphNode = {
  type: "paragraph";
  text: string;
  className?: string;
};

export type CodeBlockNode = {
  type: "code_block";
  language: string;
  code: string;
  filename?: string;
  highlightLines?: number[];
};

export type ListNode = {
  type: "list";
  ordered?: boolean;
  items: string[] | ContentNode[];
};

export type TableNode = {
  type: "table";
  headers: string[];
  rows: string[][];
  className?: string;
};

export type QuoteNode = {
  type: "quote";
  text: string;
  author?: string;
  source?: string;
};

export type ImageNode = {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type LinkNode = {
  type: "link";
  text: string;
  url: string;
  external?: boolean;
};

export type ComponentNode = {
  type: "component";
  name: string;
  props: Record<string, unknown>;
};

// 代码示例
export type CodeExample = {
  language: string;
  code: string;
  description?: string;
  filename?: string;
};

// FAQ 条目
export type FAQCategory = "pricing" | "technical" | "support" | "security" | "general";

export type FAQItem = {
  question: string;
  answer: string;
  category: FAQCategory;
  keywords?: string[];
};

// API 比较
export type ComparisonApi = {
  id: number;
  name: string;
  score: number;
};

export type ComparisonFeature = {
  name: string;
  description: string;
  weight: number; // 1-10, 特性重要程度
  values: Record<number, string | boolean | number>; // apiId -> value
};

export type ComparisonMatrix = {
  title: string;
  description?: string;
  apis: ComparisonApi[];
  features: ComparisonFeature[];
  generatedAt: string;
};

// 内容质量评分
export type ContentQualityBreakdown = {
  basicInfo: number; // 0-20
  technicalDocs: number; // 0-25
  codeExamples: number; // 0-20
  seoOptimization: number; // 0-20
  userGuidance: number; // 0-15
};

export type ContentQualityScore = {
  overall: number; // 0-100
  breakdown: ContentQualityBreakdown;
  recommendations: string[];
  calculatedAt: string;
};

// 内部链接
export type InternalLinkType = "category" | "related_api" | "comparison" | "guide" | "use_case";

export type InternalLink = {
  text: string;
  url: string;
  relevance: number; // 0-10
  type: InternalLinkType;
};

// 使用场景
export type UseCase = {
  title: string;
  description: string;
  tags: string[];
  example?: string;
};

// 模版数据上下文
export type TemplateContext = {
  api: {
    id: number;
    name: string;
    description: string;
    link: string;
    openapiUrl?: string;
    category?: {
      id: number;
      name: string;
      slug: string;
    };
    auth: string;
    cors: string;
    https: boolean;
    healthStatus: string;
    latencyMs?: number;
    lastCheckedAt?: string;
    lastError?: string;
    seoMetadata?: {
      title?: string;
      description?: string;
      keywords?: Array<{ keyword: string }>;
      h1?: string;
      h2s?: Array<{ heading: string }>;
      languages?: Array<{ language: string }>;
      docQualityScore?: number;
      hasCodeExamples?: boolean;
      ogImage?: string;
      extractedAt?: string;
    };
    aiAnalysis?: {
      summary?: string;
      useCases?: Array<{ tag: string }>;
    };
    generatedContent?: {
      seoTitle?: string;
      blogPost?: string;
      model?: string;
      lastGeneratedAt?: string;
    };
    screenshot?: {
      thumbnailUrl: string;
      fullUrl: string;
      capturedAt: string;
    };
  };
  healthSummary?: {
    uptimePct?: number;
    avgLatencyMs?: number;
    series?: Array<{
      date: string;
      status: string;
      latencyMs?: number;
    }>;
  };
  relatedApis?: Array<{
    id: number;
    name: string;
    description: string;
    auth: string;
    cors: string;
    https: boolean;
    category?: {
      name: string;
      slug: string;
    };
  }>;
  locale: string;
};

// 模版函数签名
export type TemplateFunction<T = ContentNode[]> = (ctx: TemplateContext) => T;

export type BlockTemplate = {
  title: TemplateFunction<string>;
  content: TemplateFunction<ContentNode[]>;
  schema?: TemplateFunction<Record<string, unknown>>;
  estimatedWordCount?: number; // 预估字数
};

// 条件评估器
export class ConditionEvaluator {
  static evaluate(condition: RenderCondition, ctx: TemplateContext): boolean {
    const value = this.getNestedValue(ctx, condition.field);

    switch (condition.operator) {
      case "exists":
        return value !== undefined && value !== null && value !== "";

      case "equals":
        return value === condition.value;

      case "gt":
        return typeof value === "number" && typeof condition.value === "number"
          ? value > condition.value
          : false;

      case "lt":
        return typeof value === "number" && typeof condition.value === "number"
          ? value < condition.value
          : false;

      case "contains":
        if (typeof value === "string" && typeof condition.value === "string") {
          return value.includes(condition.value);
        }
        if (Array.isArray(value)) {
          return value.includes(condition.value);
        }
        return false;

      case "in":
        return Array.isArray(condition.value) && condition.value.includes(value);

      default:
        return false;
    }
  }

  static evaluateAll(conditions: RenderCondition[], ctx: TemplateContext): boolean {
    return conditions.every((condition) => this.evaluate(condition, ctx));
  }

  private static getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return current;
  }
}

// 内容生成器基类
export abstract class ContentGenerator {
  abstract generate(ctx: TemplateContext): ContentNode[];

  protected shouldGenerate(conditions: RenderCondition[], ctx: TemplateContext): boolean {
    return ConditionEvaluator.evaluateAll(conditions, ctx);
  }

  protected wrapInSection(
    title: string,
    content: ContentNode[],
    id?: string
  ): ContentNode[] {
    return [
      {
        type: "heading",
        level: 2,
        text: title,
        id,
      },
      ...content,
    ];
  }
}

// 工具函数
export class TemplateUtils {
  static extractBaseUrl(url: string): string {
    try {
      if (typeof URL === "undefined") return url;
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return url;
    }
  }

  static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  static calculateReadingTime(wordCount: number): number {
    // 假设阅读速度 200 字/分钟
    return Math.ceil(wordCount / 200);
  }
}
