import { Link } from "@/i18n/navigation";
import { formatCompactNumber } from "@/lib/format";

interface CatalogHeroProps {
  stats: {
    totalApis: number;
    categories: number;
    stars: number | null;
    forks: number | null;
  };
  t: (key: string) => string;
  tNav: (key: string) => string;
  tCatalogPage: (key: string) => string;
}

export function CatalogHero({
  stats,
  t,
  tNav,
  tCatalogPage,
}: CatalogHeroProps) {
  return (
    <section className="terminal-surface-elevated p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-[var(--text-primary)] glow-text">
            <span className="text-[var(--accent-cyan)]">$</span>{" "}
            {tCatalogPage("terminalCommand")}
            <span className="ml-2 inline-block h-6 w-3 animate-[blink_1s_infinite] bg-[var(--accent-green)]" />
          </h1>
          <p className="mt-2 max-w-xl font-mono text-sm text-[var(--text-muted)]">
            <span className="text-[var(--accent-purple)]">{`//`}</span>{" "}
            {t("subtitle")}
          </p>
        </div>

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

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/search" className="terminal-btn terminal-btn-primary">
          <span className="text-[var(--bg-primary)]">🔍 {tNav("search")}</span>
        </Link>
        <Link href="/" className="terminal-btn terminal-btn-secondary">
          <span>🏠 {tNav("home")}</span>
        </Link>
      </div>
    </section>
  );
}
