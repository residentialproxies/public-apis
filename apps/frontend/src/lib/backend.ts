export type PublicCategory = {
  id: number | string;
  name: string;
  slug: string;
  description: string | null;
  apiCount: number;
  lastSyncedAt: string | null;
};

export type PublicApiListItem = {
  id: number | string;
  name: string;
  description: string;
  link: string;
  category: null | { id: number | string; name: string; slug: string };
  auth: string;
  https: boolean;
  cors: string;
  syncStatus: string;
  healthStatus: string;
  latencyMs: number | null;
  lastCheckedAt: string | null;
  lastStatusCode: number | null;
};

export type PublicApiListResponse = {
  docs: PublicApiListItem[];
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
};

export type PublicApiDetail = {
  id: number | string;
  sourceKey: string;
  name: string;
  description: string;
  link: string;
  openapiUrl: string | null;
  generatedContent: null | {
    seoTitle?: string | null;
    blogPost?: string | null;
    lastGeneratedAt?: string | null;
    model?: string | null;
  };
  aiAnalysis: null | {
    summary?: string | null;
    useCases?: Array<{ tag?: string | null }> | null;
    codeSnippets?: unknown;
    error?: string | null;
    updatedAt?: string | null;
  };
  screenshot: null | {
    thumbnailUrl?: string | null;
    fullUrl?: string | null;
    capturedAt?: string | null;
  };
  seoMetadata: null | {
    title?: string | null;
    description?: string | null;
    keywords?: Array<{ keyword?: string | null }> | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: string | null;
    twitterCard?: string | null;
    favicon?: string | null;
    h1?: string | null;
    h2s?: Array<{ heading?: string | null }> | null;
    languages?: Array<{ language?: string | null }> | null;
    hasCodeExamples?: boolean | null;
    docQualityScore?: number | null;
    extractedAt?: string | null;
  };
  category: null | { id: number | string; name: string; slug: string };
  auth: string;
  https: boolean;
  cors: string;
  syncStatus: string;
  healthStatus: string;
  latencyMs: number | null;
  lastCheckedAt: string | null;
  healthNextCheckAt: string | null;
  lastStatusCode: number | null;
  consecutiveFailures: number;
  lastError: string | null;
  upstream: null | {
    name?: string | null;
    description?: string | null;
    link?: string | null;
    auth?: string | null;
    https?: boolean | null;
    cors?: string | null;
  };
  override: null | {
    name?: string | null;
    description?: string | null;
    link?: string | null;
    isManualOverride?: boolean | null;
    overrideReason?: string | null;
  };
  source: null | {
    repo?: string | null;
    path?: string | null;
    commitSha?: string | null;
    lineRef?: number | null;
    fetchedAt?: string | null;
  };
  updatedAt: string;
  createdAt: string;
};

export type PublicApiHealthSummary = {
  apiId: number;
  days: number;
  since: string;
  total: number;
  ok: number;
  uptime: number | null;
  uptimePct: number | null;
  avgLatencyMs: number | null;
  series: Array<{
    checkedAt: string | null;
    healthStatus: string | null;
    statusCode: number | null;
    latencyMs: number | null;
    isSsrfBlocked: boolean;
  }>;
};

export type PublicFacetsResponse = {
  total: number;
  categories: Array<{
    id: number | string;
    name: string;
    slug: string;
    count: number;
  }>;
  auth: Record<string, number>;
  cors: Record<string, number>;
  healthStatus: Record<string, number>;
  https: { true: number; false: number };
};

function getCmsBaseUrl(): string {
  return process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3001";
}

function buildUrl(
  pathname: string,
  params?: Record<string, string | undefined>,
): string {
  const url = new URL(pathname, getCmsBaseUrl());
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === "") continue;
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit & { revalidate?: number; timeoutMs?: number },
): Promise<T> {
  const { revalidate, timeoutMs = 10_000, ...rest } = init ?? {};

  const controller = new AbortController();
  const timeoutId: ReturnType<typeof setTimeout> | undefined =
    timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const response = await fetch(url, {
      ...rest,
      signal: rest.signal ?? controller.signal,
      headers: {
        accept: "application/json",
        ...(rest.headers ?? {}),
      },
      next: revalidate !== undefined ? { revalidate } : undefined,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Request failed (${response.status}): ${url}\n${body}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "AbortError" &&
      timeoutMs > 0
    ) {
      throw new Error(`Request timed out (${timeoutMs}ms): ${url}`);
    }

    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function fetchCategories(): Promise<PublicCategory[]> {
  const url = buildUrl("/api/v1/public/categories");
  const data = await fetchJson<{ docs: PublicCategory[] }>(url, {
    revalidate: 600,
  });
  return data.docs;
}

export async function fetchApisList(
  query: Record<string, string | undefined>,
): Promise<PublicApiListResponse> {
  const url = buildUrl("/api/v1/public/apis", query);
  return fetchJson<PublicApiListResponse>(url, { revalidate: 120 });
}

export async function fetchFacets(
  query: Record<string, string | undefined>,
): Promise<PublicFacetsResponse> {
  const url = buildUrl("/api/v1/public/facets", query);
  return fetchJson<PublicFacetsResponse>(url, { revalidate: 120 });
}

export async function fetchApiDetail(id: string): Promise<PublicApiDetail> {
  const url = buildUrl(`/api/v1/public/apis/${encodeURIComponent(id)}`);
  return fetchJson<PublicApiDetail>(url, { revalidate: 300 });
}

export async function fetchApiHealthSummary(
  id: string,
  days = 30,
): Promise<PublicApiHealthSummary> {
  const url = buildUrl(`/api/v1/public/apis/${encodeURIComponent(id)}/health`, {
    days: String(days),
  });
  return fetchJson<PublicApiHealthSummary>(url, { revalidate: 300 });
}

export async function fetchApiOpenapiSpec(
  id: string,
): Promise<Record<string, unknown>> {
  const url = buildUrl(`/api/v1/public/apis/${encodeURIComponent(id)}/openapi`);
  return fetchJson<Record<string, unknown>>(url, { revalidate: 300 });
}
