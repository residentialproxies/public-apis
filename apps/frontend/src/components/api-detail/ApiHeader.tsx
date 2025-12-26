import { StatusPill } from "@/components/StatusPill";
import { formatDateTime } from "@/lib/format";
import type { ApiHeaderProps } from "./types";

export function ApiHeader({
  api,
  healthSummary,
  apiVersion,
  t,
  tCategories,
}: ApiHeaderProps) {
  return (
    <header className="ui-surface mt-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            {api.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {api.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            {api.category ? (
              <span className="ui-chip">{tCategories(api.category.name)}</span>
            ) : null}
            {apiVersion ? (
              <span className="ui-chip inline-flex items-center gap-1 bg-[var(--accent-green)]/10 text-[var(--accent-green)]">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                    clipRule="evenodd"
                  />
                </svg>
                v{apiVersion}
              </span>
            ) : null}
            <span className="ui-chip">
              {t("signalAuth")}: {api.auth}
            </span>
            <span className="ui-chip">
              {t("signalCors")}: {api.cors}
            </span>
            <span className="ui-chip">
              {t("signalHttps")}: {api.https ? t("yes") : t("no")}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <StatusPill status={api.healthStatus} />
          <div className="text-right text-xs text-[var(--text-muted)]">
            <div>{formatDateTime(api.lastCheckedAt) ?? t("notChecked")}</div>
            {api.latencyMs !== null ? (
              <div className="font-mono">{api.latencyMs}ms</div>
            ) : null}
          </div>

          {healthSummary && healthSummary.uptimePct !== null ? (
            <div className="flex flex-col items-end gap-2">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  healthSummary.uptimePct >= 99.9
                    ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
                    : healthSummary.uptimePct >= 99
                      ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                      : healthSummary.uptimePct >= 95
                        ? "bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)]"
                        : "bg-[var(--accent-red)]/10 text-[var(--accent-red)]"
                }`}
              >
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {healthSummary.uptimePct.toFixed(2)}% {t("uptime30d")}
              </div>
              {healthSummary.avgLatencyMs !== null ? (
                <div className="text-xs text-[var(--text-muted)]">
                  <span className="font-mono text-[var(--text-primary)]">
                    {healthSummary.avgLatencyMs}ms
                  </span>{" "}
                  {t("avgLatency")}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
