import type { MetadataRoute } from "next";

import { fetchApisList, fetchCategories } from "@/lib/backend";
import { slugify } from "@/lib/slugify";
import { getSiteUrl } from "@/lib/site";
import { locales } from "@/i18n/config";

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// SEO: Extended type to include health status for dynamic priority calculation
type ApiWithHealth = {
  id: number | string;
  name: string;
  lastCheckedAt?: string | null;
  healthStatus?: string;
  https?: boolean;
};

async function fetchAllApis(): Promise<ApiWithHealth[]> {
  const pageSize = 100;
  const sort = "name";

  const first = await fetchApisList({
    page: "1",
    limit: String(pageSize),
    sort,
  });

  const all: ApiWithHealth[] = first.docs.map((d) => ({
    id: d.id,
    name: d.name,
    lastCheckedAt: d.lastCheckedAt,
    healthStatus: d.healthStatus,
    https: d.https,
  }));
  const totalPages = Math.min(first.totalPages, 500);

  if (totalPages <= 1) return all;

  const pages = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
  const concurrency = 5;

  for (let index = 0; index < pages.length; index += concurrency) {
    const chunk = pages.slice(index, index + concurrency);
    const results = await Promise.all(
      chunk.map((page) =>
        fetchApisList({ page: String(page), limit: String(pageSize), sort }),
      ),
    );

    for (const res of results) {
      all.push(
        ...res.docs.map((d) => ({
          id: d.id,
          name: d.name,
          lastCheckedAt: d.lastCheckedAt,
          healthStatus: d.healthStatus,
          https: d.https,
        })),
      );
    }
  }

  return all;
}

/**
 * Helper to create alternates for multi-language support
 */
function createAlternates(base: string, path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of locales) {
    alternates[locale] = `${base}${locale === "en" ? "" : `/${locale}`}${path}`;
  }
  alternates["x-default"] = `${base}${path}`;
  return alternates;
}

/**
 * SEO: Calculate dynamic priority based on API health and quality signals.
 * This helps search engines understand which pages are most valuable to users.
 *
 * Priority factors:
 * - Health status: "online" gets highest priority, "unknown" lowest
 * - HTTPS: APIs with HTTPS get a slight boost
 * - Freshness: Recently checked APIs get a small boost
 *
 * @param api - The API with health metadata
 * @returns Priority between 0.3 and 0.9
 */
function calculateApiPriority(api: ApiWithHealth): number {
  let priority = 0.5; // Base priority

  // Health status boost (most important factor)
  switch (api.healthStatus) {
    case "online":
      priority += 0.3; // Healthy APIs are most valuable
      break;
    case "slow":
      priority += 0.15; // Slow but working APIs
      break;
    case "down":
      priority -= 0.1; // Broken APIs are less valuable
      break;
    case "unknown":
    default:
      // Unchecked APIs get base priority
      break;
  }

  // HTTPS boost (security signal)
  if (api.https) {
    priority += 0.05;
  }

  // Freshness boost (recently checked data is more reliable)
  if (api.lastCheckedAt) {
    const daysSinceCheck = Math.floor(
      (Date.now() - new Date(api.lastCheckedAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysSinceCheck < 7) {
      priority += 0.05; // Checked within a week
    }
  }

  // Clamp to valid sitemap priority range [0, 1]
  return Math.max(0.3, Math.min(0.9, priority));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  // Static routes with language alternates
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: { languages: createAlternates(base, "/") },
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: { languages: createAlternates(base, "/about") },
    },
    {
      url: `${base}/bot`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
      alternates: { languages: createAlternates(base, "/bot") },
    },
    {
      url: `${base}/catalog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: createAlternates(base, "/catalog") },
    },
  ];

  try {
    const [categories, apis] = await withTimeout(
      Promise.all([fetchCategories(), fetchAllApis()]),
      45_000,
    );

    // Category routes with proper lastModified and alternates
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: c.lastSyncedAt ? new Date(c.lastSyncedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: { languages: createAlternates(base, `/category/${c.slug}`) },
    }));

    // SEO: API detail routes with dynamic priority based on health signals
    const apiRoutes: MetadataRoute.Sitemap = apis.map((a) => ({
      url: `${base}/api/${a.id}/${slugify(a.name)}`,
      lastModified: a.lastCheckedAt ? new Date(a.lastCheckedAt) : now,
      changeFrequency: "weekly" as const,
      priority: calculateApiPriority(a),
      alternates: {
        languages: createAlternates(base, `/api/${a.id}/${slugify(a.name)}`),
      },
    }));

    return [...staticRoutes, ...categoryRoutes, ...apiRoutes];
  } catch {
    // Build environments (CI) may not have access to the CMS.
    // Return a minimal sitemap instead of failing the build.
    return staticRoutes;
  }
}
