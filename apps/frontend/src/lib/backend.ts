import {
  BackendError,
  NetworkError,
  TimeoutError,
  ApiFetchError,
} from "./errors";
import { getCmsBaseUrl, CACHE_CONFIG } from "./config";

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Request Deduplication Cache
// ============================================================================

/**
 * SECURITY: LRU cache for pending request deduplication.
 *
 * Without size limits, an attacker could flood the application with unique URLs,
 * causing unbounded memory growth. This LRU cache prevents that attack.
 *
 * Configuration:
 * - MAX_PENDING_REQUESTS: Maximum number of concurrent pending requests to track
 * - EVICTION_BATCH_SIZE: Number of entries to evict when limit is reached
 */
const MAX_PENDING_REQUESTS = 500;
const EVICTION_BATCH_SIZE = 50;

// Track access order for LRU eviction
const pendingRequestsLru = new Map<string, number>();
let pendingRequestsAccessCounter = 0;

/**
 * Get a value from the pending requests cache and update LRU order.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pendingRequestsGet(key: string): Promise<any> | undefined {
  const value = pendingRequests.get(key);
  if (value !== undefined) {
    // Update access time for LRU
    pendingRequestsLru.set(key, ++pendingRequestsAccessCounter);
  }
  return value;
}

/**
 * Set a value in the pending requests cache with FIFO eviction.
 * Optimized from O(n log n) sort to O(1) using Map iteration order.
 * JavaScript Maps maintain insertion order, making FIFO eviction efficient.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pendingRequestsSet(key: string, value: Promise<any>): void {
  // Evict oldest entries if at capacity using O(1) FIFO instead of O(n log n) sort
  if (pendingRequestsLru.size >= MAX_PENDING_REQUESTS) {
    const iterator = pendingRequestsLru.keys();
    for (let i = 0; i < EVICTION_BATCH_SIZE; i++) {
      const result = iterator.next();
      if (result.done) break;
      const oldest = result.value;
      pendingRequestsLru.delete(oldest);
      pendingRequests.delete(oldest);
    }
  }

  pendingRequestsLru.set(key, ++pendingRequestsAccessCounter);
  pendingRequests.set(key, value);
}

/**
 * Delete a value from the pending requests cache.
 */
function pendingRequestsDelete(key: string): void {
  pendingRequestsLru.delete(key);
  pendingRequests.delete(key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pendingRequests = new Map<string, Promise<any>>();

// ============================================================================
// URL Building
// ============================================================================

/**
 * SECURITY: LRU cache for built URLs to prevent string manipulation DoS.
 *
 * Without size limits, repeated calls with unique URL parameters could
 * consume unbounded memory. This LRU cache prevents that attack.
 *
 * Configuration:
 * - MAX_URL_CACHE_SIZE: Maximum number of URLs to cache
 * - URL_CACHE_EVICTION_SIZE: Number of entries to evict when limit is reached
 */
const MAX_URL_CACHE_SIZE = 200;
const URL_CACHE_EVICTION_SIZE = 20;

// Track access order for URL cache LRU eviction
const urlCacheLru = new Map<string, number>();
let urlCacheAccessCounter = 0;

const urlCache = new Map<string, string>();

function buildUrl(
  pathname: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  // Create cache key
  const cacheKey = params
    ? `${pathname}?${new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ).toString()}`
    : pathname;

  // Check cache with LRU update
  const cached = urlCache.get(cacheKey);
  if (cached !== undefined) {
    // Update access time for LRU
    urlCacheLru.set(cacheKey, ++urlCacheAccessCounter);
    return cached;
  }

  // Build URL
  const url = new URL(pathname, getCmsBaseUrl());

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const urlString = url.toString();

  // SECURITY: Enforce cache size limit with FIFO eviction
  // Optimized from O(n log n) sort to O(1) using Map iteration order
  if (urlCache.size >= MAX_URL_CACHE_SIZE) {
    const iterator = urlCacheLru.keys();
    for (let i = 0; i < URL_CACHE_EVICTION_SIZE; i++) {
      const result = iterator.next();
      if (result.done) break;
      const oldest = result.value;
      urlCacheLru.delete(oldest);
      urlCache.delete(oldest);
    }
  }

  urlCache.set(cacheKey, urlString);
  urlCacheLru.set(cacheKey, ++urlCacheAccessCounter);

  return urlString;
}

// Type-safe URL builders for common endpoints
export const backendUrls = {
  categories: () => buildUrl("/api/v1/public/categories"),
  apis: (params: Record<string, string | undefined>) =>
    buildUrl("/api/v1/public/apis", params),
  apiDetail: (id: string | number) =>
    buildUrl(`/api/v1/public/apis/${encodeURIComponent(id)}`),
  apiHealth: (id: string | number, days = 30) =>
    buildUrl(`/api/v1/public/apis/${encodeURIComponent(id)}/health`, {
      days: String(days),
    }),
  apiOpenapi: (id: string | number) =>
    buildUrl(`/api/v1/public/apis/${encodeURIComponent(id)}/openapi`),
  facets: (params: Record<string, string | undefined>) =>
    buildUrl("/api/v1/public/facets", params),
  search: (query: Record<string, string | undefined>) =>
    buildUrl("/api/v1/public/search", query),
  proxy: () => buildUrl("/api/v1/public/proxy"),
  health: () => buildUrl("/api/health"),
} as const;

// ============================================================================
// Retry Logic
// ============================================================================

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  retryableStatuses?: number[];
  retryableErrors?: string[];
}

async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    retryableErrors = ["fetch failed", "network", "timeout", "abort"],
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) break;

      // Check if error is retryable
      const errorMessage = lastError.message.toLowerCase();
      const isRetryableError = retryableErrors.some((pattern) =>
        errorMessage.includes(pattern.toLowerCase()),
      );

      if (!isRetryableError) break;

      // Exponential backoff with jitter
      const delay = Math.min(
        initialDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        maxDelayMs,
      );

      console.warn(
        `[fetchWithRetry] Attempt ${attempt + 1}/${maxRetries + 1} failed, ` +
          `retrying in ${Math.round(delay)}ms...`,
        { error: lastError.message },
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============================================================================
// Fetch with Error Handling
// ============================================================================

async function fetchJson<T>(
  url: string,
  init?: RequestInit & {
    revalidate?: number;
    timeoutMs?: number;
    retries?: number;
    deduplicate?: boolean;
  },
): Promise<T> {
  const {
    revalidate,
    timeoutMs = 10_000,
    retries = 3,
    deduplicate = true,
    ...rest
  } = init ?? {};

  // Deduplication check using LRU-aware getter
  if (deduplicate) {
    const pending = pendingRequestsGet(url);
    if (pending) {
      console.debug(`[Dedup] Reusing pending request for ${url}`);
      return pending as Promise<T>;
    }
  }

  const requestId =
    (typeof crypto !== "undefined" && crypto.randomUUID?.().slice(0, 8)) ||
    Math.random().toString(36).slice(2, 10);

  const controller = new AbortController();
  const timeoutId: ReturnType<typeof setTimeout> | undefined =
    timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  const startTime = Date.now();

  const promise = fetchWithRetry(
    async () => {
      console.debug(`[fetch:${requestId}] Starting ${url}`);

      const response = await fetch(url, {
        ...rest,
        signal: rest.signal ?? controller.signal,
        headers: {
          accept: "application/json",
          "x-request-id": requestId,
          ...(rest.headers ?? {}),
        },
        next: revalidate !== undefined ? { revalidate } : undefined,
      });

      const elapsed = Date.now() - startTime;
      console.debug(
        `[fetch:${requestId}] Completed in ${elapsed}ms with status ${response.status}`,
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new BackendError(response.status, url, body, requestId);
      }

      return (await response.json()) as T;
    },
    { maxRetries: retries, retryableStatuses: [408, 429, 500, 502, 503, 504] },
  )
    .catch((error) => {
      if (error instanceof BackendError) {
        throw error;
      }

      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "AbortError" &&
        timeoutMs > 0
      ) {
        throw new TimeoutError(url, timeoutMs);
      }

      throw new NetworkError(url, error as Error);
    })
    .finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });

  // Add to pending requests cache using LRU-aware setter
  if (deduplicate) {
    pendingRequestsSet(url, promise);
    promise.finally(() => {
      // Clean up after request completes using LRU-aware deleter
      setTimeout(() => {
        pendingRequestsDelete(url);
      }, 1000); // Keep for 1s for potential rapid re-requests
    });
  }

  return promise;
}

// ============================================================================
// API Functions
// ============================================================================

export async function fetchCategories(): Promise<PublicCategory[]> {
  const url = backendUrls.categories();
  const data = await fetchJson<{ docs: PublicCategory[] }>(
    url,
    CACHE_CONFIG.categories,
  );
  return data.docs;
}

export async function fetchApisList(
  query: Record<string, string | undefined>,
): Promise<PublicApiListResponse> {
  const url = backendUrls.apis(query);
  return fetchJson<PublicApiListResponse>(url, CACHE_CONFIG.apisList);
}

export async function fetchFacets(
  query: Record<string, string | undefined>,
): Promise<PublicFacetsResponse> {
  const url = backendUrls.facets(query);
  return fetchJson<PublicFacetsResponse>(url, CACHE_CONFIG.facets);
}

export async function fetchApiDetail(id: string): Promise<PublicApiDetail> {
  const url = backendUrls.apiDetail(id);
  return fetchJson<PublicApiDetail>(url, CACHE_CONFIG.apiDetail);
}

export async function fetchApiDetailOrThrow(
  id: string,
): Promise<PublicApiDetail> {
  try {
    return await fetchApiDetail(id);
  } catch (error) {
    console.error(`Failed to fetch API detail for id=${id}:`, error);
    throw new ApiFetchError(
      `Failed to load API details`,
      `/api/v1/public/apis/${id}`,
      error instanceof Error ? error : undefined,
    );
  }
}

export async function fetchApiHealthSummary(
  id: string,
  days = 30,
): Promise<PublicApiHealthSummary> {
  const url = backendUrls.apiHealth(id, days);
  return fetchJson<PublicApiHealthSummary>(url, CACHE_CONFIG.health);
}

export async function fetchApiOpenapiSpec(
  id: string,
): Promise<Record<string, unknown>> {
  const url = backendUrls.apiOpenapi(id);
  return fetchJson<Record<string, unknown>>(url, { revalidate: 300 });
}

// ============================================================================
// Backend Health Check
// ============================================================================

export async function checkBackendHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = performance.now();
  const healthUrl = backendUrls.health();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch(healthUrl, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });

    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - startTime);

    if (response.ok) {
      console.log(`[Health] Backend healthy (${latency}ms)`);
      return { healthy: true, latency };
    }

    return {
      healthy: false,
      error: `Backend returned ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Health] Backend health check failed:", errorMessage);
    return {
      healthy: false,
      error: errorMessage.includes("abort")
        ? "Connection timeout"
        : errorMessage,
    };
  }
}
