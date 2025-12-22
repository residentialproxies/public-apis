"use client";

import { useMemo } from "react";

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
      return "bg-emerald-500";
    case "slow":
      return "bg-amber-500";
    case "down":
      return "bg-rose-500";
    case "unknown":
      return "bg-zinc-400";
    default:
      return "bg-zinc-300";
  }
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "live":
      return "Live";
    case "slow":
      return "Slow";
    case "down":
      return "Down";
    case "unknown":
      return "Unknown";
    default:
      return "Pending";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HealthChart({ series, className }: Props) {
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
          No health check data available yet.
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
            className="h-3 w-3 rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Live: {stats.live}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Slow: {stats.slow}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full bg-rose-500"
            aria-hidden="true"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Down: {stats.down}
          </span>
        </div>
        {stats.unknown > 0 && (
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full bg-zinc-400"
              aria-hidden="true"
            />
            <span className="text-zinc-700 dark:text-zinc-300">
              Unknown: {stats.unknown}
            </span>
          </div>
        )}
        {stats.avgLatency !== null && (
          <div className="ml-auto text-zinc-500 dark:text-zinc-400">
            Avg latency: <span className="font-mono">{stats.avgLatency}ms</span>
          </div>
        )}
      </div>

      {/* Timeline visualization */}
      <div className="relative">
        <div
          className="flex gap-0.5 overflow-hidden rounded-lg"
          role="img"
          aria-label={`Health check history: ${stats.live} live, ${stats.slow} slow, ${stats.down} down out of ${stats.total} checks`}
        >
          {recentChecks.map((check, idx) => (
            <div
              key={idx}
              className="group relative flex-1"
              title={`${formatDate(check.checkedAt)} ${formatTime(check.checkedAt)}: ${statusLabel(check.healthStatus)}${check.latencyMs ? ` (${check.latencyMs}ms)` : ""}${check.statusCode ? ` - HTTP ${check.statusCode}` : ""}`}
            >
              <div
                className={`h-8 w-full transition-all duration-200 hover:opacity-80 ${statusColor(check.healthStatus)}`}
              />
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block dark:bg-zinc-700">
                <div className="font-medium">
                  {statusLabel(check.healthStatus)}
                </div>
                <div className="text-zinc-300">
                  {formatDate(check.checkedAt)} {formatTime(check.checkedAt)}
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
        <div className="mt-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {recentChecks.length > 0
              ? formatDate(recentChecks[recentChecks.length - 1]?.checkedAt)
              : ""}
          </span>
          <span>
            {recentChecks.length > 0
              ? formatDate(recentChecks[0]?.checkedAt)
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
