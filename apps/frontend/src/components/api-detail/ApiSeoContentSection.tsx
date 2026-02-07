import { DocQualityScore } from "@/components/DocQualityScore";
import { LanguageTags } from "@/components/LanguageTags";
import { KeywordTags } from "@/components/KeywordTags";
import { DocumentStructure } from "@/components/DocumentStructure";
import type { SeoContentSectionProps } from "./types";

export function ApiSeoContentSection({ api, t }: SeoContentSectionProps) {
  if (!api.seoMetadata?.extractedAt) {
    return null;
  }

  const hasQualityScore =
    api.seoMetadata.docQualityScore !== null &&
    api.seoMetadata.docQualityScore !== undefined;

  const hasLanguages =
    api.seoMetadata.languages && api.seoMetadata.languages.length > 0;

  const hasKeywords =
    api.seoMetadata.keywords && api.seoMetadata.keywords.length > 0;

  const hasHeadings = api.seoMetadata.h2s && api.seoMetadata.h2s.length > 0;

  const hasMetadata = api.seoMetadata.title || api.seoMetadata.description;

  return (
    <section className="ui-surface mt-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-[var(--accent-cyan)]"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("seoTitle")}
        </h2>
      </div>

      {/* Documentation Quality Score */}
      {hasQualityScore && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            {t("docQuality")}
          </span>
          <DocQualityScore
            score={api.seoMetadata.docQualityScore!}
            maxScore={10}
            size="md"
            showLabel={true}
          />
        </div>
      )}

      {/* Quality Indicators */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {api.seoMetadata.hasCodeExamples && (
          <span className="ui-chip inline-flex items-center gap-1 bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/30">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {t("codeExamples")}
          </span>
        )}
        {api.seoMetadata.h1 && (
          <span className="ui-chip inline-flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {t("mainHeading")}
          </span>
        )}
        {api.seoMetadata.ogImage && (
          <span className="ui-chip inline-flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            {t("openGraph")}
          </span>
        )}
      </div>

      {/* Programming Languages - Using reusable component */}
      {hasLanguages && (
        <LanguageTags
          languages={api.seoMetadata.languages!}
          title={t("programmingLanguages")}
          maxDisplay={10}
          className="mt-4"
        />
      )}

      {/* Keywords - Using reusable component */}
      {hasKeywords && (
        <KeywordTags
          keywords={api.seoMetadata.keywords!}
          title={t("keywords")}
          maxDisplay={15}
          expandable={true}
          className="mt-4"
        />
      )}

      {/* Document Structure - Using reusable component */}
      {hasHeadings && (
        <DocumentStructure
          headings={api.seoMetadata.h2s!}
          title={t("sectionHeadings")}
          collapsible={true}
          defaultExpanded={false}
          className="mt-4"
        />
      )}

      {/* Page Title & Description */}
      {hasMetadata && (
        <div className="ui-surface-muted mt-4 rounded-lg p-4 text-xs space-y-2">
          {api.seoMetadata.title && (
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <span className="font-semibold text-[var(--text-muted)] shrink-0">
                {t("pageTitle")}:
              </span>
              <span className="text-[var(--text-secondary)] break-words">
                {api.seoMetadata.title}
              </span>
            </div>
          )}
          {api.seoMetadata.description && (
            <div className="flex flex-col sm:flex-row sm:gap-2">
              <span className="font-semibold text-[var(--text-muted)] shrink-0">
                {t("metaDescription")}:
              </span>
              <span className="text-[var(--text-secondary)] break-words">
                {api.seoMetadata.description}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <p className="mt-4 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
        <svg
          className="h-3 w-3 shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        {t("seoNote")}
      </p>
    </section>
  );
}
