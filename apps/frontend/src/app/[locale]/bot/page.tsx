import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { fetchPublicApisRepoStats, fallbackRepoStats } from "@/lib/github";
import { formatCompactNumber, formatDate } from "@/lib/format";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bot" });

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/bot" },
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
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

export default async function BotPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("bot");

  const repoStats = await fetchPublicApisRepoStats().catch(() =>
    fallbackRepoStats(),
  );
  const stars = formatCompactNumber(repoStats.stars) ?? "community-backed";
  const updated = formatDate(repoStats.pushedAt) ?? "recently";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "ApiNavigatorBot",
    description: t("subtitle"),
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "ApiNavigatorBot",
      applicationCategory: "WebCrawler",
      operatingSystem: "Cloud",
      description: t("subtitle"),
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      {/* Breadcrumb navigation */}
      <nav aria-label="Breadcrumb">
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
          <span className="text-[var(--accent-purple)]">//</span>{" "}
          {t("subtitle")}
        </p>
      </header>

      <TerminalWindow title={t("infoTitle")}>
        <div className="space-y-4 p-6">
          <p className="font-mono text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--accent-green)]">&gt;</span>{" "}
            {t("infoP1")}
          </p>
          <p className="font-mono text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--accent-green)]">&gt;</span>{" "}
            {t("infoP2", { stars, updated })}
          </p>
        </div>
      </TerminalWindow>

      <TerminalWindow title={t("userAgentTitle")}>
        <div className="p-6">
          <h2 className="font-mono text-base font-semibold text-[var(--text-primary)]">
            <span className="text-[var(--accent-cyan)]">#</span>{" "}
            {t("userAgentHeading")}
          </h2>
          <div className="mt-4 rounded border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-4">
            <code className="font-mono text-sm text-[var(--accent-green)] break-all">
              {t("userAgentValue")}
            </code>
          </div>
          <p className="mt-4 font-mono text-sm text-[var(--text-muted)]">
            {t("userAgentNote")}
          </p>
        </div>
      </TerminalWindow>

      <TerminalWindow title={t("flightPlanTitle")}>
        <div className="p-6">
          <h2 className="font-mono text-base font-semibold text-[var(--text-primary)]">
            <span className="text-[var(--accent-yellow)]">#</span>{" "}
            {t("flightPlanHeading")}
          </h2>
          <ol className="mt-4 space-y-3 font-mono text-sm">
            {[
              t("flightPlan1"),
              t("flightPlan2"),
              t("flightPlan3"),
              t("flightPlan4"),
              t("flightPlan5"),
              t("flightPlan6"),
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
          <p className="mt-4 font-mono text-xs text-[var(--text-dim)]">
            {t("flightPlanNote")}
          </p>
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
              t("security6"),
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[var(--text-secondary)]"
              >
                <span className="text-[var(--accent-red)]">[!]</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </TerminalWindow>

      <TerminalWindow title={t("signalsTitle")}>
        <div className="p-6">
          <h2 className="font-mono text-base font-semibold text-[var(--text-primary)]">
            <span className="text-[var(--accent-purple)]">#</span>{" "}
            {t("signalsHeading")}
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded border border-[var(--border-dim)] p-4">
              <h3 className="font-mono text-sm font-semibold text-[var(--accent-green)]">
                {t("statusPillTitle")}
              </h3>
              <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                {t("statusPillDesc")}
              </p>
            </div>
            <div className="rounded border border-[var(--border-dim)] p-4">
              <h3 className="font-mono text-sm font-semibold text-[var(--accent-cyan)]">
                {t("latencyTitle")}
              </h3>
              <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                {t("latencyDesc")}
              </p>
            </div>
            <div className="rounded border border-[var(--border-dim)] p-4">
              <h3 className="font-mono text-sm font-semibold text-[var(--accent-yellow)]">
                {t("lastCheckedTitle")}
              </h3>
              <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                {t("lastCheckedDesc")}
              </p>
            </div>
          </div>
        </div>
      </TerminalWindow>

      <TerminalWindow title={t("faqTitle")}>
        <div className="p-6">
          <h2 className="font-mono text-base font-semibold text-[var(--text-primary)]">
            <span className="text-[var(--accent-cyan)]">#</span>{" "}
            {t("faqHeading")}
          </h2>
          <div className="mt-4 space-y-4">
            {[
              { q: t("faqQ1"), a: t("faqA1") },
              { q: t("faqQ2"), a: t("faqA2") },
              { q: t("faqQ3"), a: t("faqA3") },
              { q: t("faqQ4"), a: t("faqA4") },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded border border-[var(--border-dim)] p-4"
              >
                <h3 className="font-mono text-sm font-semibold text-[var(--accent-yellow)]">
                  Q: {item.q}
                </h3>
                <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                  A: {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </TerminalWindow>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
