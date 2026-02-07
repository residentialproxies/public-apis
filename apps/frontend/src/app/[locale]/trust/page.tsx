import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import type { Locale } from "@/i18n/config";
import {
  generateHreflangUrls,
  toLocalizedPath,
  toLocalizedUrl,
} from "@/lib/locales";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

type TrustCopy = {
  title: string;
  subtitle: string;
  breadcrumbLabel: string;
  backToHome: string;
};

const COPY: Record<Locale, TrustCopy> = {
  en: {
    title: "Trust & Editorial Policy",
    subtitle: "How we ensure quality, transparency, and safety",
    breadcrumbLabel: "Trust page navigation",
    backToHome: "Back to catalog",
  },
  zh: {
    title: "信任与编辑政策",
    subtitle: "我们如何保证质量、透明度与安全",
    breadcrumbLabel: "信任页导航",
    backToHome: "返回目录",
  },
  ja: {
    title: "信頼と編集ポリシー",
    subtitle: "品質・透明性・安全性を担保する方法",
    breadcrumbLabel: "信頼ページナビゲーション",
    backToHome: "カタログへ戻る",
  },
  es: {
    title: "Politica de Confianza y Editorial",
    subtitle: "Como garantizamos calidad, transparencia y seguridad",
    breadcrumbLabel: "Navegacion de confianza",
    backToHome: "Volver al catalogo",
  },
  "pt-BR": {
    title: "Politica de Confianca e Editorial",
    subtitle: "Como garantimos qualidade, transparencia e seguranca",
    breadcrumbLabel: "Navegacao de confianca",
    backToHome: "Voltar ao catalogo",
  },
  de: {
    title: "Vertrauen & Redaktionsrichtlinie",
    subtitle: "Wie wir Qualitat, Transparenz und Sicherheit sicherstellen",
    breadcrumbLabel: "Vertrauensseiten-Navigation",
    backToHome: "Zuruck zum Katalog",
  },
};

const TRUST_SECTIONS = [
  {
    heading: "Editorial independence",
    points: [
      "API listings are built from verifiable public sources and structured processing pipelines.",
      "Quality signals are generated from machine checks and documented transformation rules.",
      "Commercial relationships do not override core ranking, health, or quality indicators.",
    ],
  },
  {
    heading: "Data quality standards",
    points: [
      "We normalize naming, category, authentication, and protocol metadata to reduce ambiguity.",
      "Health checks and latency metrics are refreshed continuously with explicit status labeling.",
      "Broken, stale, or low-confidence records are deprioritized or marked clearly.",
    ],
  },
  {
    heading: "Security and abuse prevention",
    points: [
      "Backend data pipelines enforce SSRF-aware request controls and validation boundaries.",
      "Operational endpoints are protected by token-based controls and environment isolation.",
      "We monitor anomalies and maintain incident response practices to keep the platform resilient.",
    ],
  },
  {
    heading: "User transparency",
    points: [
      "Methodology and platform behavior are documented in public docs and release notes.",
      "Legal pages explain privacy, terms, and processing boundaries in plain language.",
      "You can report quality issues to improve listings and health signals.",
    ],
  },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = (locale as Locale) in COPY ? (locale as Locale) : "en";
  const content = COPY[typedLocale];
  const siteUrl = getSiteUrl();
  const localizedUrl = toLocalizedUrl(siteUrl, "/trust", typedLocale);

  return {
    title: `${content.title} | ${SITE_NAME}`,
    description: content.subtitle,
    alternates: {
      canonical: localizedUrl,
      languages: generateHreflangUrls("/trust", siteUrl),
    },
    openGraph: {
      title: `${content.title} | ${SITE_NAME}`,
      description: content.subtitle,
      url: localizedUrl,
      type: "website",
    },
  };
}

export default async function TrustPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = (locale as Locale) in COPY ? (locale as Locale) : "en";
  const content = COPY[typedLocale];
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    description: content.subtitle,
    url: toLocalizedUrl(siteUrl, "/trust", typedLocale),
    about: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
    mentions: [
      toLocalizedUrl(siteUrl, "/privacy", typedLocale),
      toLocalizedUrl(siteUrl, "/terms", typedLocale),
      toLocalizedUrl(siteUrl, "/about", typedLocale),
    ],
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

      <section className="terminal-surface p-6 space-y-5">
        {TRUST_SECTIONS.map((section) => (
          <article key={section.heading} className="space-y-2">
            <h2 className="font-mono text-sm font-semibold text-[var(--accent-green)]">
              {section.heading}
            </h2>
            <ul className="space-y-2">
              {section.points.map((point) => (
                <li
                  key={point}
                  className="font-mono text-sm text-[var(--text-secondary)] flex items-start gap-2"
                >
                  <span className="text-[var(--accent-cyan)]">&gt;</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="terminal-surface p-6 space-y-3">
        <h2 className="font-mono text-sm font-semibold text-[var(--accent-cyan)]">
          Governance references
        </h2>
        <div className="flex flex-wrap gap-3 font-mono text-sm">
          <Link
            href={toLocalizedPath("/privacy", typedLocale)}
            className="terminal-chip"
          >
            Privacy Policy
          </Link>
          <Link
            href={toLocalizedPath("/terms", typedLocale)}
            className="terminal-chip-cyan"
          >
            Terms of Service
          </Link>
          <Link
            href={toLocalizedPath("/about", typedLocale)}
            className="terminal-chip-purple"
          >
            About Platform
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
