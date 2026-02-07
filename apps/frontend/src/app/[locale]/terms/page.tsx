import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import type { Locale } from "@/i18n/config";
import { generateHreflangUrls, toLocalizedUrl } from "@/lib/locales";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

type TermsCopy = {
  title: string;
  subtitle: string;
  breadcrumbLabel: string;
  backToHome: string;
};

const LAST_UPDATED = "2026-02-07";

const COPY: Record<Locale, TermsCopy> = {
  en: {
    title: "Terms of Service",
    subtitle: "Usage terms and platform responsibilities",
    breadcrumbLabel: "Terms navigation",
    backToHome: "Back to catalog",
  },
  zh: {
    title: "服务条款",
    subtitle: "使用规则与平台责任",
    breadcrumbLabel: "条款导航",
    backToHome: "返回目录",
  },
  ja: {
    title: "利用規約",
    subtitle: "利用条件とプラットフォーム責任",
    breadcrumbLabel: "規約ナビゲーション",
    backToHome: "カタログへ戻る",
  },
  es: {
    title: "Terminos de Servicio",
    subtitle: "Condiciones de uso y responsabilidades",
    breadcrumbLabel: "Navegacion de terminos",
    backToHome: "Volver al catalogo",
  },
  "pt-BR": {
    title: "Termos de Servico",
    subtitle: "Regras de uso e responsabilidades da plataforma",
    breadcrumbLabel: "Navegacao de termos",
    backToHome: "Voltar ao catalogo",
  },
  de: {
    title: "Nutzungsbedingungen",
    subtitle: "Nutzungsregeln und Plattformverantwortung",
    breadcrumbLabel: "Bedingungen-Navigation",
    backToHome: "Zuruck zum Katalog",
  },
};

const TERMS_SECTIONS = [
  {
    heading: "1. Service scope",
    body: "Public API provides directory, search, and metadata services for discovering public APIs. We may adjust features to improve reliability and quality.",
  },
  {
    heading: "2. Acceptable use",
    body: "You agree not to misuse the platform, interfere with service operations, scrape aggressively, bypass security controls, or violate applicable laws.",
  },
  {
    heading: "3. API source attribution",
    body: "Many API records are aggregated from public sources. Underlying API terms are owned by their providers, and you are responsible for complying with them.",
  },
  {
    heading: "4. Availability disclaimer",
    body: "Availability signals and metadata are provided on a best-effort basis. We do not guarantee uninterrupted access or perfect accuracy at all times.",
  },
  {
    heading: "5. Liability and changes",
    body: "To the extent allowed by law, the service is provided as-is. We may update these terms and will publish updates with an effective date.",
  },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = (locale as Locale) in COPY ? (locale as Locale) : "en";
  const content = COPY[typedLocale];
  const siteUrl = getSiteUrl();
  const localizedUrl = toLocalizedUrl(siteUrl, "/terms", typedLocale);

  return {
    title: `${content.title} | ${SITE_NAME}`,
    description: content.subtitle,
    alternates: {
      canonical: localizedUrl,
      languages: generateHreflangUrls("/terms", siteUrl),
    },
    openGraph: {
      title: `${content.title} | ${SITE_NAME}`,
      description: content.subtitle,
      url: localizedUrl,
      type: "website",
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = (locale as Locale) in COPY ? (locale as Locale) : "en";
  const content = COPY[typedLocale];
  const siteUrl = getSiteUrl();
  const localizedUrl = toLocalizedUrl(siteUrl, "/terms", typedLocale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    description: content.subtitle,
    url: localizedUrl,
    dateModified: LAST_UPDATED,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl,
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      <nav aria-label={content.breadcrumbLabel}>
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-green)]"
        >
          <span className="text-[var(--accent-cyan)]">cd</span>
          <span className="text-[var(--text-muted)]">&gt;</span>
          <span>{content.backToHome}</span>
        </Link>
      </nav>

      <header className="terminal-surface-elevated p-6">
        <h1 className="font-mono text-2xl font-bold text-[var(--text-primary)]">
          <span className="text-[var(--accent-cyan)]">$</span> {content.title}
        </h1>
        <p className="mt-3 font-mono text-sm text-[var(--text-muted)]">
          <span className="text-[var(--accent-purple)]">//</span>{" "}
          {content.subtitle}
        </p>
      </header>

      <section className="terminal-surface p-6 space-y-4">
        {TERMS_SECTIONS.map((section) => (
          <article key={section.heading} className="space-y-2">
            <h2 className="font-mono text-sm font-semibold text-[var(--accent-green)]">
              {section.heading}
            </h2>
            <p className="font-mono text-sm text-[var(--text-secondary)]">
              {section.body}
            </p>
          </article>
        ))}
        <p className="font-mono text-xs text-[var(--text-dim)]">
          Effective date: {LAST_UPDATED}
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
