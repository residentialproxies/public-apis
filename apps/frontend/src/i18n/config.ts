export const locales = ["en", "zh", "ja", "es", "pt-BR", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
  es: "Espanol",
  "pt-BR": "Portugues (Brasil)",
  de: "Deutsch",
};

export const localeFlags: Record<Locale, string> = {
  en: "EN",
  zh: "ZH",
  ja: "JA",
  es: "ES",
  "pt-BR": "PT",
  de: "DE",
};
