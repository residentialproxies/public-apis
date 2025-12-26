"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeFlags, localeNames, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  const ariaLabels: Record<Locale, string> = {
    en: "Switch to English",
    zh: "切换到中文",
    ja: "日本語に切り替える",
    es: "Cambiar a Espanol",
    "pt-BR": "Mudar para Portugues",
    de: "Auf Deutsch wechseln",
  };

  return (
    <div className="relative flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => handleChange(l)}
          aria-label={ariaLabels[l]}
          aria-pressed={locale === l}
          className={`rounded px-2 py-1 font-mono text-xs transition-all ${
            locale === l
              ? "bg-[var(--accent-green)] text-[var(--bg-primary)] font-medium"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {localeFlags[l]}
        </button>
      ))}
    </div>
  );
}
