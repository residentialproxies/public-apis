/**
 * Centralized configuration management
 * All backend URLs should reference this single source of truth
 */

type Config = {
  cmsUrl: string;
  siteUrl: string;
  nodeEnv: string;
};

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const nodeEnv = process.env.NODE_ENV ?? "development";

  // Validate required environment variables
  if (nodeEnv === "production") {
    if (!cmsUrl) {
      throw new Error(
        "NEXT_PUBLIC_CMS_URL is required in production. " +
          "Set it in your deployment environment or .env.production",
      );
    }
    if (!siteUrl) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL is required in production. " +
          "Set it in your deployment environment or .env.production",
      );
    }
  }

  // Use defaults for development
  const finalCmsUrl = cmsUrl ?? "http://localhost:3001";
  const finalSiteUrl = siteUrl ?? "http://localhost:3010";

  // Validate URL formats
  try {
    new URL(finalCmsUrl);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_CMS_URL: "${finalCmsUrl}". ` +
        `Expected a valid URL like "http://localhost:3001" or "https://cms.example.com"`,
    );
  }

  try {
    new URL(finalSiteUrl);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SITE_URL: "${finalSiteUrl}". ` +
        `Expected a valid URL like "http://localhost:3010" or "https://example.com"`,
    );
  }

  cachedConfig = {
    cmsUrl: finalCmsUrl.replace(/\/$/, ""),
    siteUrl: finalSiteUrl.replace(/\/$/, ""),
    nodeEnv,
  };

  // Log in development (not in production)
  if (nodeEnv === "development") {
    console.log("[Config] Initialized:", {
      cmsUrl: cachedConfig.cmsUrl,
      siteUrl: cachedConfig.siteUrl,
      nodeEnv: cachedConfig.nodeEnv,
    });
  }

  return cachedConfig;
}

export function getCmsBaseUrl(): string {
  return getConfig().cmsUrl;
}

export function getSiteUrl(): string {
  return getConfig().siteUrl;
}

export function isDevelopment(): boolean {
  return getConfig().nodeEnv === "development";
}

export function isProduction(): boolean {
  return getConfig().nodeEnv === "production";
}

// Cache configuration
export const CACHE_CONFIG = {
  // Highly stable data
  categories: { revalidate: 3600 }, // 1 hour
  facets: { revalidate: 600 }, // 10 minutes

  // Semi-stable data
  apisList: { revalidate: 300 }, // 5 minutes
  apiDetail: { revalidate: 600 }, // 10 minutes

  // Real-time data
  health: { revalidate: 60 }, // 1 minute
  search: { revalidate: 120 }, // 2 minutes
} as const;

// Validate config at module load time (server-side)
if (typeof window === "undefined") {
  try {
    getConfig();
  } catch (error) {
    console.error("[Config] Failed to initialize:", error);
    // In development, show helpful error page
    // In production, this will cause the build/startup to fail
  }
}
