/**
 * API content translation utilities
 *
 * This module provides translation functions for API names and descriptions
 * when the backend data is only available in English.
 */

/**
 * Translates API description to the target locale
 * Falls back to original description if translation not available
 */
export function translateApiDescription(
  description: string,
  locale: string,
): string {
  // For now, return original description
  // In the future, this could integrate with a translation service
  // or lookup translations from a mapping file

  if (locale !== "zh") {
    return description;
  }

  // Common patterns translation
  const translations: Record<string, string> = {
    // Add common translations here as needed
  };

  // Check if exact match exists
  const exactMatch = translations[description];
  if (exactMatch) {
    return exactMatch;
  }

  // For now, return original - content should remain in English until
  // proper backend translation support is implemented
  return description;
}

/**
 * Translates API name to the target locale
 * Most API names are proper nouns and should remain unchanged
 */
export function translateApiName(name: string, locale: string): string {
  // API names are typically proper nouns and should not be translated
  return name;
}

/**
 * Creates a locale-aware description formatter
 * Adds locale context to descriptions when needed
 */
export function formatApiDescription(
  description: string,
  locale: string,
): string {
  const translated = translateApiDescription(description, locale);
  return translated;
}
