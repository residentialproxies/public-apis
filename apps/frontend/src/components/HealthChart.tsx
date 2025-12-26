"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";

type HealthPoint = {
  checkedAt: string | null;
  healthStatus: string | null;
  statusCode: number | null;
  latencyMs: number | null;
  isSsrfBlocked: boolean;
};

type Props = {
  series: HealthPoint[];
  className?: string;
};

function statusColor(status: string | null): string {
  switch (status) {
    case "live":
      return "bg-[var(--status-live)]";
    case "slow":
      return "bg-[var(--status-slow)]";
    case "down":
      return "bg-[var(--status-down)]";
    case "unknown":
      return "bg-[var(--status-unknown)]";
    default:
      return "bg-[var(--status-pending)]";
  }
}

function statusLabel(
  status: string | null,
  t: (key: string) => string,
): string {
  switch (status) {
    case "live":
      return t("live");
    case "slow":
      return t("slow");
    case "down":
      return t("down");
    case "unknown":
      return t("unknown");
    default:
      return "Pending";
  }
}

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function formatTime(dateStr: string | null, locale: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HealthChart({ series, className }: Props) {
  const t = useTranslations("healthChart");
  const locale = useLocale();
  const recentChecks = useMemo(() => {
    // Take the last 30 checks, most recent first
    return [...series].slice(-30).reverse();
  }, [series]);

  // Calculate stats - must be called before any early returns to satisfy rules of hooks
  const stats = useMemo(() => {
    const live = recentChecks.filter((c) => c.healthStatus === "live").length;
    const slow = recentChecks.filter((c) => c.healthStatus === "slow").length;
    const down = recentChecks.filter((c) => c.healthStatus === "down").length;
    const unknown = recentChecks.filter(
      (c) => c.healthStatus === "unknown",
    ).length;
    const total = recentChecks.length;

    const latencies = recentChecks
      .map((c) => c.latencyMs)
      .filter((l): l is number => l !== null);
    const avgLatency =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null;

    return { live, slow, down, unknown, total, avgLatency };
  }, [recentChecks]);

  if (recentChecks.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("noData")}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Stats summary */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full bg-[var(--status-live)]"
            aria-hidden="true"
          />
          <span className="text-[var(--text-secondary)]">
            {t("live")}: {stats.live}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full bg-[var(--status-slow)]"
            aria-hidden="true"
          />
          <span className="text-[var(--text-secondary)]">
            {t("slow")}: {stats.slow}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full bg-[var(--status-down)]"
            aria-hidden="true"
          />
          <span className="text-[var(--text-secondary)]">
            {t("down")}: {stats.down}
          </span>
        </div>
        {stats.unknown > 0 && (
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full bg-[var(--status-unknown)]"
              aria-hidden="true"
            />
            <span className="text-[var(--text-secondary)]">
              {t("unknown")}: {stats.unknown}
            </span>
          </div>
        )}
        {stats.avgLatency !== null && (
          <div className="ml-auto text-[var(--text-muted)]">
            {t("avgLatency")}:{" "}
            <span className="font-mono">{stats.avgLatency}ms</span>
          </div>
        )}
      </div>

      {/* Timeline visualization */}
      <div className="relative">
        <div
          className="flex gap-0.5 overflow-hidden rounded-lg"
          role="img"
          aria-label={`${t("healthHistory")}: ${stats.live} ${t("live").toLowerCase()}, ${stats.slow} ${t("slow").toLowerCase()}, ${stats.down} ${t("down").toLowerCase()} out of ${stats.total} checks`}
        >
          {recentChecks.map((check, idx) => (
            <div
              key={idx}
              className="group relative flex-1"
              title={`${formatDate(check.checkedAt, locale)} ${formatTime(check.checkedAt, locale)}: ${statusLabel(check.healthStatus, t)}${check.latencyMs ? ` (${check.latencyMs}ms)` : ""}${check.statusCode ? ` - HTTP ${check.statusCode}` : ""}`}
            >
              <div
                className={`h-8 w-full transition-all duration-200 hover:opacity-80 ${statusColor(check.healthStatus)}`}
              />
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-primary)] shadow-lg border border-[var(--border-dim)] group-hover:block">
                <div className="font-medium">
                  {statusLabel(check.healthStatus, t)}
                </div>
                <div className="text-[var(--text-muted)]">
                  {formatDate(check.checkedAt, locale)}{" "}
                  {formatTime(check.checkedAt, locale)}
                </div>
                {check.latencyMs !== null && (
                  <div className="font-mono">{check.latencyMs}ms</div>
                )}
                {check.statusCode !== null && (
                  <div>HTTP {check.statusCode}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Time labels */}
        <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
          <span>
            {recentChecks.length > 0
              ? formatDate(
                  recentChecks[recentChecks.length - 1]?.checkedAt,
                  locale,
                )
              : ""}
          </span>
          <span>
            {recentChecks.length > 0
              ? formatDate(recentChecks[0]?.checkedAt, locale)
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
