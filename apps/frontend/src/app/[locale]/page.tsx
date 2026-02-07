import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

import {
  fetchCategories,
  fetchFacets,
  checkBackendHealth,
} from "@/lib/backend";
import { isConnectionError } from "@/lib/errors";
import { ConnectionError } from "@/components/ConnectionError";
import { TerminalWindow } from "@/components/TerminalWindow";
import { getSiteUrl } from "@/lib/site";
import {
  generateHreflangUrls,
  toLocalizedPath,
  toLocalizedUrl,
  toOpenGraphLocale,
} from "@/lib/locales";
import type { Locale } from "@/i18n/config";

export const revalidate = 300; // 5 minutes ISR

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * SEO: Generate metadata for home page with proper OpenGraph and Twitter Card
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = getSiteUrl();
  const t = await getTranslations({ locale, namespace: "metadata" });

  const title = t("title");
  const description = t("description");
  const localizedHomeUrl = toLocalizedUrl(siteUrl, "/", locale as Locale);

  // SEO: Generate hreflang URLs for all language versions
  const hreflangUrls = generateHreflangUrls("/", siteUrl);
  const ogLocale = toOpenGraphLocale(locale as Locale);

  return {
    title,
    description,
    alternates: {
      canonical: localizedHomeUrl,
      languages: hreflangUrls,
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      url: localizedHomeUrl,
      siteName: "API Navigator",
      locale: ogLocale,
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
      site: "@api_navigator",
      images: [`${siteUrl}/opengraph-image`],
    },
  };
}

/**
 * SEO: Generate WebSite and Organization Schema.org structured data
 */
function generateHomePageSchemas(siteUrl: string, locale: string) {
  const schemas = [];

  // WebSite schema with SearchAction for sitelinks search box
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "API Navigator",
    alternateName: "Public APIs Directory",
    url: siteUrl,
    inLanguage: locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : locale === "pt-BR" ? "pt-BR" : locale === "de" ? "de-DE" : "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}${toLocalizedPath(
          "/search",
          locale as Locale,
        )}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });

  // Organization schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "API Navigator",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      "https://github.com/zhaoyao91/public-api",
      "https://github.com/public-apis/public-apis",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "technical support",
      url: `${siteUrl}${toLocalizedPath("/about", locale as Locale)}`,
    },
  });

  return schemas;
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tCategories = await getTranslations("categories");

  // Check backend health first
  const health = await checkBackendHealth();
  if (!health.healthy) {
    return (
      <ConnectionError
        error={new Error(health.error || t("backendConnectionError"))}
        retryUrl="/"
        title={t("backendConnectionFailed")}
      />
    );
  }

  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];
  let facets: Awaited<ReturnType<typeof fetchFacets>> | null = null;
  let fetchError: Error | null = null;

  try {
    [categories, facets] = await Promise.all([
      fetchCategories(),
      fetchFacets({}),
    ]);
  } catch (error) {
    console.error("[Home] Failed to load data:", error);
    fetchError = error instanceof Error ? error : new Error(String(error));

    // For connection errors, show the ConnectionError component
    if (isConnectionError(fetchError)) {
      return <ConnectionError error={fetchError} retryUrl="/" />;
    }

    // For other errors, continue with fallback data
  }

  const totalApis = facets?.total ?? 1800;
  const totalCategories = categories.length || 45;

  // Calculate health stats
  const healthStats = facets?.healthStatus ?? {};
  const liveCount = healthStats["live"] ?? 0;
  const totalChecked = Object.values(healthStats).reduce(
    (sum, count) => sum + count,
    0,
  );
  const healthyPct =
    totalChecked > 0 ? Math.round((liveCount / totalChecked) * 100) : 0;

  // Get top categories sorted by API count
  const topCategories = [...categories]
    .sort((a, b) => b.apiCount - a.apiCount)
    .slice(0, 6);

  const features = [
    {
      icon: "find",
      title: t("feature1Title"),
      description: t("feature1Desc"),
      color: "var(--accent-green)",
      chipColor: "terminal-chip",
    },
    {
      icon: "ping",
      title: t("feature2Title"),
      description: t("feature2Desc"),
      color: "var(--accent-cyan)",
      chipColor: "terminal-chip-cyan",
    },
    {
      icon: "docs",
      title: t("feature3Title"),
      description: t("feature3Desc"),
      color: "var(--accent-purple)",
      chipColor: "terminal-chip-purple",
    },
    {
      icon: "ai",
      title: t("feature4Title"),
      description: t("feature4Desc"),
      color: "var(--accent-orange)",
      chipColor: "terminal-chip-orange",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Hero Section */}
      <section className="terminal-surface-elevated p-8 md:p-12">
        <div className="flex flex-col items-center text-center">
          {/* ASCII Art Logo */}
          <div className="mb-6 font-mono text-xs leading-tight text-[var(--accent-green)] opacity-60 hidden md:block">
            <pre className="ascii-art">{`
    ___   ____  ____   _   _            _             _
   / _ \\ |  _ \\|_  _| | \\ | | __ ___   _(_) __ _  __ _| |_ ___  _ __
  | |_| || |_) || |   |  \\| |/ _\` \\ \\ / / |/ _\` |/ _\` | __/ _ \\| '__|
  |  _  ||  __/ | |   | |\\  | (_| |\\ V /| | (_| | (_| | || (_) | |
  |_| |_||_|   |___|  |_| \\_|\\__,_| \\_/ |_|\\__, |\\__,_|\\__\\___/|_|
                                          |___/
            `}</pre>
          </div>

          {/* Main Title */}
          <h1 className="font-mono text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)]">
            <span className="text-[var(--accent-cyan)]">$</span>{" "}
            <span className="glow-text">{t("mainTitle")}</span>
            <span className="ml-2 inline-block h-8 w-3 animate-[blink_1s_infinite] bg-[var(--accent-green)]" />
          </h1>

          {/* Subtitle */}
          <p className="mt-4 max-w-2xl font-mono text-base md:text-lg text-[var(--text-muted)]">
            <span className="text-[var(--accent-purple)]">{"//"}</span>{" "}
            {t("subtitle1")}
            <br />
            <span className="text-[var(--accent-purple)]">{"//"}</span>{" "}
            {t("subtitle2")}
          </p>

          {/* Stats Row */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="terminal-surface-muted px-6 py-3 text-center">
              <div className="font-mono text-2xl font-bold text-[var(--accent-green)] glow-text">
                {totalApis.toLocaleString()}+
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {t("publicApis")}
              </div>
            </div>
            <div className="terminal-surface-muted px-6 py-3 text-center">
              <div className="font-mono text-2xl font-bold text-[var(--accent-cyan)]">
                {totalCategories}
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {t("categories")}
              </div>
            </div>
            <div className="terminal-surface-muted px-6 py-3 text-center">
              <div className="font-mono text-2xl font-bold text-[var(--accent-yellow)]">
                {healthyPct}%
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {t("healthy")}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/search" className="terminal-btn terminal-btn-primary">
              <span className="text-[var(--bg-primary)]">
                {t("exploreCatalog")}
              </span>
            </Link>
            <Link href="/about" className="terminal-btn terminal-btn-secondary">
              <span>{t("readMe")}</span>
            </Link>
          </div>

          {/* Terminal Prompt */}
          <div className="mt-8 font-mono text-sm text-[var(--text-muted)]">
            <span className="text-[var(--accent-green)]">&gt;</span>{" "}
            {t("readyPrompt")}{" "}
            <span className="text-[var(--accent-cyan)]">{t("pressEnter")}</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-8">
        <TerminalWindow title={t("featuresTitle")}>
          <div className="p-6">
            <div className="mb-4 font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {t("catFeatures")}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="terminal-surface-muted p-5 transition-all duration-200 hover:border-[var(--accent-green)]/50"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded border font-mono text-sm font-bold"
                      style={{
                        borderColor: feature.color,
                        color: feature.color,
                        boxShadow: `0 0 10px ${feature.color}40`,
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="font-mono text-base font-semibold text-[var(--text-primary)]">
                        <span style={{ color: feature.color }}>&gt;</span>{" "}
                        {feature.title}
                      </h3>
                      <p className="mt-2 font-mono text-sm text-[var(--text-muted)]">
                        {feature.description}
                      </p>
                      <span
                        className={`mt-3 inline-block ${feature.chipColor}`}
                      >
                        {feature.icon}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TerminalWindow>
      </section>

      {/* Categories Preview Section */}
      <section className="mt-8">
        <TerminalWindow title={t("categoriesTitle")}>
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-mono text-sm text-[var(--text-muted)]">
                <span className="text-[var(--accent-cyan)]">$</span>{" "}
                {t("lsCategories")}
              </div>
              <Link
                href="/search"
                className="font-mono text-sm text-[var(--accent-green)] hover:underline"
              >
                {t("viewAll")}
              </Link>
            </div>

            {topCategories.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topCategories.map((category, index) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="group terminal-surface-muted flex items-center justify-between p-4 transition-all duration-200 hover:border-[var(--accent-green)]/50 hover:bg-[var(--bg-elevated)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[var(--accent-cyan)] opacity-60 group-hover:opacity-100">
                        [{String(index + 1).padStart(2, "0")}]
                      </span>
                      <span className="font-mono text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-green)]">
                        {tCategories(category.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[var(--text-dim)]">
                        {category.apiCount} {t("apis")}
                      </span>
                      <span className="text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100">
                        &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="font-mono text-sm text-[var(--text-muted)]">
                <span className="text-[var(--accent-yellow)]">LOADING</span>:
                {t("loadingCategories")}
              </div>
            )}
          </div>
        </TerminalWindow>
      </section>

      {/* Quick Actions Section */}
      <section className="mt-8">
        <TerminalWindow title={t("quickStart")}>
          <div className="p-6">
            <div className="mb-4 font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {t("runQuickStart")}
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded border border-[var(--border-dim)] bg-[var(--bg-primary)] p-4">
                <div>
                  <div className="font-mono text-sm text-[var(--text-primary)]">
                    <span className="text-[var(--accent-green)]">01.</span>{" "}
                    {t("step1Title")}
                  </div>
                  <div className="mt-1 font-mono text-xs text-[var(--text-dim)]">
                    {t("step1Desc")}
                  </div>
                </div>
                <Link
                  href="/search"
                  className="terminal-btn terminal-btn-secondary text-center"
                >
                  {t("step1Cmd")}
                </Link>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded border border-[var(--border-dim)] bg-[var(--bg-primary)] p-4">
                <div>
                  <div className="font-mono text-sm text-[var(--text-primary)]">
                    <span className="text-[var(--accent-cyan)]">02.</span>{" "}
                    {t("step2Title")}
                  </div>
                  <div className="mt-1 font-mono text-xs text-[var(--text-dim)]">
                    {t("step2Desc")}
                  </div>
                </div>
                <Link
                  href="/search?healthStatus=live"
                  className="terminal-btn terminal-btn-secondary text-center"
                >
                  {t("step2Cmd")}
                </Link>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded border border-[var(--border-dim)] bg-[var(--bg-primary)] p-4">
                <div>
                  <div className="font-mono text-sm text-[var(--text-primary)]">
                    <span className="text-[var(--accent-purple)]">03.</span>{" "}
                    {t("step3Title")}
                  </div>
                  <div className="mt-1 font-mono text-xs text-[var(--text-dim)]">
                    {t("step3Desc")}
                  </div>
                </div>
                <Link
                  href="/search?auth=No"
                  className="terminal-btn terminal-btn-secondary text-center"
                >
                  {t("step3Cmd")}
                </Link>
              </div>
            </div>
          </div>
        </TerminalWindow>
      </section>

      {/* Use Cases Section */}
      <section className="mt-8">
        <TerminalWindow title={t("useCasesTitle")}>
          <div className="p-6">
            <div className="mb-4 font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {t("useCasesCommand")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="terminal-surface-muted p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-[var(--accent-green)]">
                    [01]
                  </span>
                  <h3 className="font-mono text-base font-semibold text-[var(--text-primary)]">
                    {t("useCase1Title")}
                  </h3>
                </div>
                <p className="font-mono text-sm text-[var(--text-muted)] pl-7">
                  {t("useCase1Desc")}
                </p>
              </div>
              <div className="terminal-surface-muted p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-[var(--accent-cyan)]">
                    [02]
                  </span>
                  <h3 className="font-mono text-base font-semibold text-[var(--text-primary)]">
                    {t("useCase2Title")}
                  </h3>
                </div>
                <p className="font-mono text-sm text-[var(--text-muted)] pl-7">
                  {t("useCase2Desc")}
                </p>
              </div>
              <div className="terminal-surface-muted p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-[var(--accent-purple)]">
                    [03]
                  </span>
                  <h3 className="font-mono text-base font-semibold text-[var(--text-primary)]">
                    {t("useCase3Title")}
                  </h3>
                </div>
                <p className="font-mono text-sm text-[var(--text-muted)] pl-7">
                  {t("useCase3Desc")}
                </p>
              </div>
              <div className="terminal-surface-muted p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-[var(--accent-yellow)]">
                    [04]
                  </span>
                  <h3 className="font-mono text-base font-semibold text-[var(--text-primary)]">
                    {t("useCase4Title")}
                  </h3>
                </div>
                <p className="font-mono text-sm text-[var(--text-muted)] pl-7">
                  {t("useCase4Desc")}
                </p>
              </div>
            </div>
          </div>
        </TerminalWindow>
      </section>

      {/* FAQ Section */}
      <section className="mt-8">
        <TerminalWindow title={t("faqTitle")}>
          <div className="p-6">
            <div className="mb-4 font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {t("faqCommand")}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <details
                  key={num}
                  className="group terminal-surface-muted rounded p-4 cursor-pointer transition-all hover:border-[var(--accent-green)]/30"
                >
                  <summary className="font-mono text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-green)] flex items-start justify-between select-none list-none">
                    <span className="flex gap-2">
                      <span className="text-[var(--accent-cyan)] shrink-0">
                        Q{num}:
                      </span>
                      <span>{t(`faq${num}Question`)}</span>
                    </span>
                    <svg
                      className="w-5 h-5 text-[var(--text-dim)] shrink-0 ml-2 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="mt-3 font-mono text-sm text-[var(--text-muted)] leading-relaxed pl-7">
                    <span className="text-[var(--accent-green)]">A:</span>{" "}
                    {t(`faq${num}Answer`)}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </TerminalWindow>
      </section>

      {/* Contact & Resources Section */}
      <section className="mt-8">
        <TerminalWindow title={t("contactTitle")}>
          <div className="p-6">
            <div className="mb-4 font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {t("contactCommand")}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <a
                href="https://github.com/zhaoyao91/public-api"
                target="_blank"
                rel="noopener noreferrer"
                className="group terminal-surface-muted p-5 transition-all duration-200 hover:border-[var(--accent-green)]/50 block"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-2xl">📦</span>
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-green)]">
                      {t("githubLabel")}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                      {t("githubDesc")}
                    </p>
                    <span className="mt-2 inline-block font-mono text-xs text-[var(--accent-cyan)]">
                      github.com &rarr;
                    </span>
                  </div>
                </div>
              </a>
              <a
                href="https://github.com/public-apis/public-apis"
                target="_blank"
                rel="noopener noreferrer"
                className="group terminal-surface-muted p-5 transition-all duration-200 hover:border-[var(--accent-purple)]/50 block"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-2xl">🌐</span>
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-purple)]">
                      {t("upstreamLabel")}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                      {t("upstreamDesc")}
                    </p>
                    <span className="mt-2 inline-block font-mono text-xs text-[var(--accent-purple)]">
                      public-apis &rarr;
                    </span>
                  </div>
                </div>
              </a>
              <Link
                href="/bot"
                className="group terminal-surface-muted p-5 transition-all duration-200 hover:border-[var(--accent-yellow)]/50 block"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-2xl">🤖</span>
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-yellow)]">
                      {t("botLabel")}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                      {t("botDesc")}
                    </p>
                    <span className="mt-2 inline-block font-mono text-xs text-[var(--accent-yellow)]">
                      ./bot &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </TerminalWindow>
      </section>

      {/* Footer CTA */}
      <section className="mt-8 terminal-surface-elevated p-8 text-center">
        <div className="font-mono">
          <div className="text-lg text-[var(--text-primary)]">
            <span className="text-[var(--accent-green)]">&gt;</span>{" "}
            {t("footerCta", { count: totalApis.toLocaleString() })}
          </div>
          <div className="mt-2 text-sm text-[var(--text-muted)]">
            <span className="text-[var(--accent-cyan)]">STATUS:</span>{" "}
            <span className="text-[var(--status-online)]">
              {t("statusOnline")}
            </span>{" "}
            |{" "}
            <span className="text-[var(--accent-purple)]">{t("uptime")}:</span>{" "}
            99.9%
          </div>
          <div className="mt-6">
            <Link
              href="/search"
              className="terminal-btn terminal-btn-primary text-lg"
            >
              <span className="text-[var(--bg-primary)]">
                {t("startExploring")}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* SEO: Schema.org structured data for home page */}
      {generateHomePageSchemas(getSiteUrl(), locale).map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </main>
  );
}
