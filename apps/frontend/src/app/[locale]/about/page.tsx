import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { fetchPublicApisRepoStats, fallbackRepoStats } from "@/lib/github";
import { formatCompactNumber, formatDate } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: `${t("subtitle")} | ${SITE_NAME}`,
    description: t("metaDescription"),
    alternates: { canonical: "/about" },
    openGraph: {
      title: `${t("subtitle")} | ${SITE_NAME}`,
      description: t("ogDescription"),
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

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");

  const repoStats = await fetchPublicApisRepoStats().catch(() =>
    fallbackRepoStats(),
  );
  const stars = formatCompactNumber(repoStats.stars) ?? "community-backed";
  const forks = formatCompactNumber(repoStats.forks) ?? "---";
  const updated = formatDate(repoStats.pushedAt) ?? "recently";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `${t("subtitle")}`,
    description: `Learn how ${SITE_NAME} helps developers discover and integrate public APIs.`,
    mainEntity: {
      "@type": "WebApplication",
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      {/* Breadcrumb navigation */}
      <nav aria-label={t("breadcrumbLabel")}>
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-green)]"
        >
          <span className="text-[var(--accent-cyan)]">cd</span>
          <span className="text-[var(--text-muted)]">&gt;</span>
          <span>{t("backToCatalog")}</span>
        </Link>
      </nav>

      {/* Hero section */}
      <header className="terminal-surface-elevated p-6">
        <h1 className="font-mono text-2xl font-bold text-[var(--text-primary)] glow-text">
          <span className="text-[var(--accent-cyan)]">$</span> {t("title")}
          <span className="ml-2 inline-block h-6 w-3 animate-[blink_1s_infinite] bg-[var(--accent-green)]" />
        </h1>
        <p className="mt-3 font-mono text-sm text-[var(--text-muted)]">
          <span className="text-[var(--accent-purple)]">{"//"}</span>{" "}
          {t("subtitle")}
        </p>
      </header>

      <TerminalWindow title={t("missionTitle")}>
        <div className="space-y-4 p-6">
          <p className="font-mono text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--accent-green)]">&gt;</span>{" "}
            {t("missionP1")}
          </p>
          <p className="font-mono text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--accent-green)]">&gt;</span>{" "}
            {t("missionP2")}
          </p>
        </div>
      </TerminalWindow>

      <TerminalWindow title={t("featuresTitle")}>
        <div className="p-6">
          <h2 className="font-mono text-base font-semibold text-[var(--text-primary)]">
            <span className="text-[var(--accent-cyan)]">#</span>{" "}
            {t("featuresHeading")}
          </h2>
          <ul className="mt-4 space-y-3 font-mono text-sm">
            {[
              t("feature1"),
              t("feature2"),
              t("feature3"),
              t("feature4"),
              t("feature5"),
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[var(--text-secondary)]"
              >
                <span className="text-[var(--accent-green)]">[+]</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </TerminalWindow>

      <TerminalWindow title={t("pipelineTitle")}>
        <div className="p-6">
          <h2 className="font-mono text-base font-semibold text-[var(--text-primary)]">
            <span className="text-[var(--accent-cyan)]">#</span>{" "}
            {t("pipelineHeading")}
          </h2>
          <ol className="mt-4 space-y-3 font-mono text-sm">
            {[
              t("pipeline1"),
              t("pipeline2"),
              t("pipeline3"),
              t("pipeline4"),
              t("pipeline5"),
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[var(--text-secondary)]"
              >
                <span className="text-[var(--accent-yellow)]">
                  {String(i + 1).padStart(2, "0")}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </TerminalWindow>

      <TerminalWindow title={t("securityTitle")}>
        <div className="p-6">
          <h2 className="font-mono text-base font-semibold text-[var(--text-primary)]">
            <span className="text-[var(--accent-red)]">#</span>{" "}
            {t("securityHeading")}
          </h2>
          <ul className="mt-4 space-y-3 font-mono text-sm">
            {[
              t("security1"),
              t("security2"),
              t("security3"),
              t("security4"),
              t("security5"),
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[var(--text-secondary)]"
              >
                <span className="text-[var(--accent-cyan)]">[*]</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </TerminalWindow>

      <TerminalWindow title={t("statsTitle")}>
        <div className="p-6">
          <h2 className="font-mono text-base font-semibold text-[var(--text-primary)]">
            <span className="text-[var(--accent-purple)]">#</span>{" "}
            {t("statsHeading")}
          </h2>
          <div className="mt-4 overflow-hidden rounded border border-[var(--border-dim)]">
            <table className="min-w-full divide-y divide-[var(--border-dim)] font-mono text-sm">
              <thead className="bg-[var(--bg-tertiary)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                    {t("statsSignal")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                    {t("statsValue")}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)] hidden sm:table-cell">
                    {t("statsWhy")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-dim)] bg-[var(--bg-secondary)]">
                <tr>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {t("statsStars")}
                  </td>
                  <td className="px-4 py-3 text-[var(--accent-green)]">
                    {stars}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] hidden sm:table-cell">
                    {t("statsStarsWhy")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {t("statsForks")}
                  </td>
                  <td className="px-4 py-3 text-[var(--accent-cyan)]">
                    {forks}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] hidden sm:table-cell">
                    {t("statsForksWhy")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {t("statsLastUpdate")}
                  </td>
                  <td className="px-4 py-3 text-[var(--accent-yellow)]">
                    {updated}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] hidden sm:table-cell">
                    {t("statsLastUpdateWhy")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {t("statsCheckCadence")}
                  </td>
                  <td className="px-4 py-3 text-[var(--accent-orange)]">
                    {t("statsCheckCadenceValue")}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] hidden sm:table-cell">
                    {t("statsCheckCadenceWhy")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {t("statsOpenApi")}
                  </td>
                  <td className="px-4 py-3 text-[var(--accent-purple)]">
                    {t("statsOpenApiValue")}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] hidden sm:table-cell">
                    {t("statsOpenApiWhy")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 font-mono text-xs text-[var(--text-dim)]">
            <span className="text-[var(--accent-cyan)]">$</span>{" "}
            {t("statsNote")}
          </p>
        </div>
      </TerminalWindow>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
