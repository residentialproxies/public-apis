/**
 * SEO: Locale mapping utilities for consistent language code handling.
 *
 * Different platforms use different locale formats:
 * - URL routing: Short codes (zh, ja, en)
 * - OpenGraph/Facebook: Underscore format (zh_CN, ja_JP)
 * - HTML lang/Schema.org: BCP 47 hyphen format (zh-CN, ja-JP)
 */

import { defaultLocale, locales, type Locale } from "@/i18n/config";

/**
 * Convert URL locale code to OpenGraph format (with underscore).
 * OpenGraph historically uses underscore separators.
 *
 * @example
 * toOpenGraphLocale('zh') // => 'zh_CN'
 * toOpenGraphLocale('pt-BR') // => 'pt_BR'
 */
export function toOpenGraphLocale(locale: Locale): string {
  const mapping: Record<Locale, string> = {
    en: "en_US",
    zh: "zh_CN",
    ja: "ja_JP",
    es: "es_ES",
    "pt-BR": "pt_BR",
    de: "de_DE",
  };
  return mapping[locale];
}

function normalizePath(basePath: string): string {
  if (!basePath || basePath === "/") return "/";

  const withLeadingSlash = basePath.startsWith("/")
    ? basePath
    : `/${basePath}`;

  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
}

/**
 * Build a locale-aware path following next-intl `localePrefix: "as-needed"`.
 * - default locale (`en`) has no prefix
 * - non-default locales use `/<locale>` prefix
 */
export function toLocalizedPath(basePath: string, locale: Locale): string {
  const normalizedPath = normalizePath(basePath);
  const localePrefix = locale === defaultLocale ? "" : `/${locale}`;

  if (normalizedPath === "/") {
    return localePrefix || "/";
  }

  return `${localePrefix}${normalizedPath}`;
}

/**
 * Build a locale-aware absolute URL from site URL + path.
 */
export function toLocalizedUrl(
  siteUrl: string,
  basePath: string,
  locale: Locale,
): string {
  const normalizedSiteUrl = siteUrl.endsWith("/")
    ? siteUrl.slice(0, -1)
    : siteUrl;

  return `${normalizedSiteUrl}${toLocalizedPath(basePath, locale)}`;
}

/**
 * Convert URL locale code to BCP 47 format (with hyphen).
 * Used for HTML lang attribute and Schema.org JSON-LD.
 *
 * @example
 * toBcp47Locale('zh') // => 'zh-CN'
 * toBcp47Locale('pt-BR') // => 'pt-BR' (already compliant)
 */
export function toBcp47Locale(locale: Locale): string {
  const mapping: Record<Locale, string> = {
    en: "en-US",
    zh: "zh-CN",
    ja: "ja-JP",
    es: "es-ES",
    "pt-BR": "pt-BR",
    de: "de-DE",
  };
  return mapping[locale];
}

/**
 * Get the fallback locale (always English).
 * Used for alternateLocale in OpenGraph metadata.
 */
export function getFallbackLocale(): string {
  return "en_US";
}

/**
 * Generate hreflang URLs for all supported locales.
 * This helps search engines understand the language relationships between pages,
 * preventing duplicate content issues and ensuring users see the correct language version.
 *
 * @param basePath - The base path without locale prefix (e.g., "/catalog" or "/api/123/example-api")
 * @param siteUrl - The site base URL (e.g., "https://public-api.org")
 * @returns Record mapping locale codes to full URLs, including x-default
 */
export function generateHreflangUrls(
  basePath: string,
  siteUrl: string,
): Record<string, string> {
  const urls: Record<string, string> = {};

  for (const locale of locales) {
    urls[locale] = toLocalizedUrl(siteUrl, basePath, locale);
  }

  // x-default points to the default locale version
  urls["x-default"] = toLocalizedUrl(siteUrl, basePath, defaultLocale);

  return urls;
}
