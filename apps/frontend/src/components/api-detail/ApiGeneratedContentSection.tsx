import type { GeneratedContentSectionProps } from "./types";

interface AiGenNoteParams {
  model: string;
  date: string;
}

export function ApiGeneratedContentSection({
  api,
  generatedHtml,
  t,
}: GeneratedContentSectionProps) {
  if (!generatedHtml) {
    return null;
  }

  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {api.generatedContent?.seoTitle?.trim() || t("deepDive")}
      </h2>
      <article
        className="prose prose-invert max-w-none text-sm leading-relaxed prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-ul:text-[var(--text-secondary)] prose-ol:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent-green)]"
        dangerouslySetInnerHTML={{ __html: generatedHtml }}
      />
      <p className="mt-4 text-xs text-[var(--text-muted)]">
        {(t as (key: string, params?: AiGenNoteParams) => string)("aiGenNote", {
          model: api.generatedContent?.model ?? "n/a",
          date: api.generatedContent?.lastGeneratedAt ?? "n/a",
        })}
      </p>
    </section>
  );
}
