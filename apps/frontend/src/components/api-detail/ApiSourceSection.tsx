import type { SourceSectionProps } from "./types";

export function ApiSourceSection({ api, t }: SourceSectionProps) {
  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {t("source")}
      </h2>
      <div className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--text-muted)]">{t("upstream")}</span>
          <span className="font-mono">{api.source?.repo ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--text-muted)]">{t("path")}</span>
          <span className="font-mono">{api.source?.path ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--text-muted)]">{t("commit")}</span>
          <span className="font-mono">{api.source?.commitSha ?? "-"}</span>
        </div>
      </div>
    </section>
  );
}
