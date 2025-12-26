import type { PublicApiDetail, PublicApiHealthSummary } from "@/lib/backend";

export type ApiDetail = PublicApiDetail;
export type ApiHealthSummary = PublicApiHealthSummary;

export interface ApiHeaderProps {
  api: ApiDetail;
  healthSummary?: {
    uptimePct: number | null;
    avgLatencyMs: number | null;
  } | null;
  apiVersion: string | null;
  t: (key: string) => string;
  tCategories: (key: string) => string;
}

export interface AuthenticationSectionProps {
  api: ApiDetail;
  t: (key: string) => string;
}

export interface PlaceholderSectionProps {
  title: string;
  icon: string;
  t: (key: string) => string;
}

export interface ErrorCodesSectionProps {
  api: ApiDetail;
  hasOpenApiSpec: boolean;
  t: (key: string) => string;
}

export interface HealthSectionProps {
  healthSummary: ApiHealthSummary | null;
  t: (key: string) => string;
}

export interface SeoContentSectionProps {
  api: ApiDetail;
  t: (key: string) => string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationFn = (key: string, values?: any) => string;

export interface RelatedApisSectionProps {
  relatedApis: Array<{
    id: number | string;
    name: string;
    auth: string;
    cors: string;
    https: boolean;
  }>;
  categoryName?: string;
  t: TranslationFn;
  tCategories: (key: string) => string;
}

export interface AiAnalysisSectionProps {
  api: ApiDetail;
  t: (key: string) => string;
}

export interface HomepageSectionProps {
  api: ApiDetail;
  t: (key: string) => string;
}

export interface OpenApiSectionProps {
  api: ApiDetail;
  t: (key: string) => string;
}

export interface KeySignalsSectionProps {
  api: ApiDetail;
  t: (key: string) => string;
}

export interface SourceSectionProps {
  api: ApiDetail;
  t: (key: string) => string;
}

export interface ScreenshotSectionProps {
  api: ApiDetail;
  canonicalSlug: string;
  t: (key: string) => string;
}

export interface GeneratedContentSectionProps {
  api: ApiDetail;
  generatedHtml: string | null;
  t: (key: string) => string;
}
