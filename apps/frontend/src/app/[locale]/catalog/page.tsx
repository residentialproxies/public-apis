import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

import { fetchCategories } from "@/lib/backend";
import { fetchPublicApisRepoStats, fallbackRepoStats } from "@/lib/github";
import { formatCompactNumber } from "@/lib/format";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

const siteUrl = getSiteUrl();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: "/catalog",
    },
    openGraph: {
      title: `${t("title")} | ${SITE_NAME}`,
      description: t("subtitle"),
      url: "/catalog",
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

const TerminalWindow = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="terminal-surface overflow-hidden">
    <div className="terminal-header rounded-t-lg">
      <div className="flex items-center gap-1.5">
        <span className="terminal-dot terminal-dot-red" />
        <span className="terminal-dot terminal-dot-yellow" />
        <span className="terminal-dot terminal-dot-green" />
      </div>
      <span className="ml-3 font-mono text-xs text-[var(--text-muted)]">
        {title}
      </span>
    </div>
    {children}
  </div>
);

// Category icons mapping
const categoryIcons: Record<string, string> = {
  animals: "🐾",
  anime: "🎌",
  "anti-malware": "🛡️",
  art: "🎨",
  authentication: "🔐",
  blockchain: "⛓️",
  books: "📚",
  business: "💼",
  calendar: "📅",
  "cloud-storage": "☁️",
  "continuous-integration": "🔄",
  cryptocurrency: "💰",
  currency: "💱",
  "data-validation": "✅",
  development: "💻",
  dictionaries: "📖",
  documents: "📄",
  email: "📧",
  entertainment: "🎭",
  environment: "🌍",
  events: "🎪",
  finance: "📈",
  food: "🍔",
  games: "🎮",
  geocoding: "📍",
  government: "🏛️",
  health: "❤️",
  jobs: "💼",
  machine: "🤖",
  music: "🎵",
  news: "📰",
  "open-data": "📊",
  "open-source": "🔓",
  "patent-trademark": "™️",
  personality: "🧠",
  "phone-number": "📱",
  photography: "📷",
  "programming-languages": "⚙️",
  science: "🔬",
  security: "🔒",
  shopping: "🛒",
  social: "👥",
  sports: "⚽",
  "test-data": "🧪",
  "text-analysis": "📝",
  tracking: "📦",
  transportation: "🚗",
  "url-shorteners": "🔗",
  vehicle: "🚙",
  video: "🎬",
  weather: "🌤️",
};

function getCategoryIcon(slug: string): string {
  return categoryIcons[slug.toLowerCase()] || "📁";
}

export default async function Catalog({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("catalog");
  const tNav = await getTranslations("nav");
  const tCategories = await getTranslations("categories");

  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];
  let repoStats: Awaited<ReturnType<typeof fetchPublicApisRepoStats>> =
    fallbackRepoStats();

  try {
    [categories, repoStats] = await Promise.all([
      fetchCategories(),
      fetchPublicApisRepoStats().catch(() => fallbackRepoStats()),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <TerminalWindow title={t("errorTitle")}>
          <div className="p-6">
            <div className="font-mono text-sm">
              <span className="text-[var(--accent-red)]">ERROR</span>
              <span className="text-[var(--text-muted)]">:</span>
              <span className="ml-2 text-[var(--text-primary)]">
                {t("errorMessage")}
              </span>
            </div>
            <p className="mt-2 font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {t("errorDesc")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className="terminal-btn terminal-btn-primary"
                href="/catalog"
              >
                <span className="text-[var(--bg-primary)]">{t("retry")}</span>
              </Link>
              <Link
                className="terminal-btn terminal-btn-secondary"
                href="/about"
              >
                <span>{t("help")}</span>
              </Link>
            </div>

            {process.env.NODE_ENV !== "production" ? (
              <div className="mt-6 rounded border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/5 p-4 font-mono text-xs">
                <div className="text-[var(--accent-red)]">// Debug Output</div>
                <pre className="mt-2 whitespace-pre-wrap break-words text-[var(--text-muted)]">
                  {errorMessage}
                </pre>
              </div>
            ) : null}
          </div>
        </TerminalWindow>
      </main>
    );
  }

  const totalApis = categories.reduce((sum, c) => sum + c.apiCount, 0);

  const stats = {
    totalApis,
    categories: categories.length,
    stars: repoStats.stars,
    forks: repoStats.forks,
  };

  // Sort categories by API count (descending)
  const sortedCategories = [...categories].sort(
    (a, b) => b.apiCount - a.apiCount,
  );

  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    description: t("subtitle"),
    url: `${siteUrl}/catalog`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: siteUrl },
    numberOfItems: categories.length,
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: categories.length,
      itemListElement: sortedCategories.slice(0, 20).map((cat, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "CollectionPage",
          name: cat.name,
          url: `${siteUrl}/category/${cat.slug}`,
          numberOfItems: cat.apiCount,
        },
      })),
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Hero Section */}
      <section className="terminal-surface-elevated p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold text-[var(--text-primary)] glow-text">
              <span className="text-[var(--accent-cyan)]">$</span> ls -la
              /api/catalog
              <span className="ml-2 inline-block h-6 w-3 animate-[blink_1s_infinite] bg-[var(--accent-green)]" />
            </h1>
            <p className="mt-2 max-w-xl font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-purple)]">//</span>{" "}
              {t("subtitle")}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="terminal-surface-muted p-3 text-center">
              <div className="font-mono text-lg font-bold text-[var(--accent-green)]">
                {stats.totalApis.toLocaleString()}
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {t("apis")}
              </div>
            </div>
            <div className="terminal-surface-muted p-3 text-center">
              <div className="font-mono text-lg font-bold text-[var(--accent-cyan)]">
                {stats.categories}
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {tNav("catalog")}
              </div>
            </div>
            <div className="terminal-surface-muted p-3 text-center">
              <div className="font-mono text-lg font-bold text-[var(--accent-yellow)]">
                {formatCompactNumber(stats.stars) ?? "—"}
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {t("stars")}
              </div>
            </div>
            <div className="terminal-surface-muted p-3 text-center">
              <div className="font-mono text-lg font-bold text-[var(--accent-purple)]">
                {formatCompactNumber(stats.forks) ?? "—"}
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {t("forks")}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/search" className="terminal-btn terminal-btn-primary">
            <span className="text-[var(--bg-primary)]">
              🔍 {tNav("search")}
            </span>
          </Link>
          <Link href="/" className="terminal-btn terminal-btn-secondary">
            <span>🏠 {tNav("home")}</span>
          </Link>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mt-6">
        <TerminalWindow title="categories.json">
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group terminal-surface-muted p-4 transition-all hover:border-[var(--accent-green)]/50 hover:bg-[var(--bg-tertiary)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getCategoryIcon(category.slug)}
                      </span>
                      <div>
                        <h3 className="font-mono text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-green)]">
                          {tCategories(category.name)}
                        </h3>
                        <p className="font-mono text-xs text-[var(--text-dim)]">
                          {category.apiCount} {t("apis")}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </div>

                  {/* Progress bar showing relative size */}
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent-green)]/60 transition-all group-hover:bg-[var(--accent-green)]"
                      style={{
                        width: `${Math.min(100, (category.apiCount / sortedCategories[0].apiCount) * 100)}%`,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </TerminalWindow>
      </section>

      {/* Popular Categories */}
      <section className="mt-6">
        <TerminalWindow title="popular-categories.sh">
          <div className="p-4">
            <p className="mb-4 font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span> Top 10
              categories by API count:
            </p>
            <div className="space-y-2">
              {sortedCategories.slice(0, 10).map((category, index) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group flex items-center justify-between rounded px-3 py-2 font-mono text-sm transition-all hover:bg-[var(--bg-tertiary)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[var(--accent-cyan)]">
                      [{String(index + 1).padStart(2, "0")}]
                    </span>
                    <span className="text-lg">
                      {getCategoryIcon(category.slug)}
                    </span>
                    <span className="text-[var(--text-primary)] group-hover:text-[var(--accent-green)]">
                      {tCategories(category.name)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[var(--accent-green)]">
                      {category.apiCount}
                    </span>
                    <span className="text-[var(--text-dim)]">{t("apis")}</span>
                    <span className="text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </TerminalWindow>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }}
      />
    </main>
  );
}
