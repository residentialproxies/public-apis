"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { HealthChart } from "@/components/HealthChart";
import type { PublicApiHealthSummary } from "@/lib/backend";

type Props = {
  apiId: string | number;
  cmsUrl: string;
};

export function ApiHealthSectionClient({ apiId, cmsUrl }: Props) {
  const t = useTranslations("api");
  const [healthSummary, setHealthSummary] =
    useState<PublicApiHealthSummary | null>(null);

  useEffect(() => {
    const url = `${cmsUrl}/api/v1/public/apis/${encodeURIComponent(apiId)}/health?days=30`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setHealthSummary(data as PublicApiHealthSummary);
      })
      .catch(() => {});
  }, [apiId, cmsUrl]);

  if (!healthSummary) return null;

  return (
    <>
      {healthSummary.uptimePct !== null && (
        <div className="mt-2 flex flex-col items-end gap-2">
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
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {healthSummary.uptimePct.toFixed(2)}% {t("uptime30d")}
          </div>
          {healthSummary.avgLatencyMs !== null && (
            <div className="text-xs text-[var(--text-muted)]">
              <span className="font-mono text-[var(--text-primary)]">
                {healthSummary.avgLatencyMs}ms
              </span>{" "}
              {t("avgLatency")}
            </div>
          )}
        </div>
      )}

      {healthSummary.series && healthSummary.series.length > 0 && (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("healthHistory")}
          </h2>
          <HealthChart series={healthSummary.series} className="mt-4" />
        </section>
      )}
    </>
  );
}
