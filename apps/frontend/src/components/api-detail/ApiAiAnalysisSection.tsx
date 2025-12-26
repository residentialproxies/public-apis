import type { AiAnalysisSectionProps } from "./types";

export function ApiAiAnalysisSection({ api, t }: AiAnalysisSectionProps) {
  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {t("aiAnalysis")}
      </h2>

      {api.aiAnalysis?.summary ? (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {api.aiAnalysis.summary}
        </p>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          {t("notAvailable")}
        </p>
      )}

      {api.aiAnalysis?.useCases?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {api.aiAnalysis.useCases
            .map((useCase) => useCase?.tag?.trim())
            .filter((tag): tag is string => !!tag)
            .slice(0, 12)
            .map((tag) => (
              <span key={tag} className="ui-chip">
                {tag}
              </span>
            ))}
        </div>
      ) : null}
    </section>
  );
}
