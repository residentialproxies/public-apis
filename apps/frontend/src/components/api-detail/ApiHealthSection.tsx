import { HealthChart } from "@/components/HealthChart";
import type { HealthSectionProps } from "./types";

export function ApiHealthSection({ healthSummary, t }: HealthSectionProps) {
  if (
    !healthSummary ||
    !healthSummary.series ||
    healthSummary.series.length === 0
  ) {
    return null;
  }

  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {t("healthHistory")}
      </h2>
      <HealthChart series={healthSummary.series} className="mt-4" />
    </section>
  );
}
