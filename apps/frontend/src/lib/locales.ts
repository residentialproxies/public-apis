/**
 * SEO: Locale mapping utilities for consistent language code handling.
 *
 * Different platforms use different locale formats:
 * - URL routing: Short codes (zh, ja, en)
 * - OpenGraph/Facebook: Underscore format (zh_CN, ja_JP)
 * - HTML lang/Schema.org: BCP 47 hyphen format (zh-CN, ja-JP)
 */

import type { Locale } from "@/i18n/config";

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
  // Import locales dynamically to avoid circular dependency
  const supportedLocales: Locale[] = ["en", "zh", "ja", "es", "pt-BR", "de"];
  const urls: Record<string, string> = {};

  for (const locale of supportedLocales) {
    urls[locale] = `${siteUrl}/${locale}${basePath}`;
  }

  // x-default points to the English version as the primary/fallback language
  urls["x-default"] = `${siteUrl}/en${basePath}`;

  return urls;
}
