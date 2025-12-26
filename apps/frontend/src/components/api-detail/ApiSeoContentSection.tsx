import type { SeoContentSectionProps } from "./types";

export function ApiSeoContentSection({ api, t }: SeoContentSectionProps) {
  if (!api.seoMetadata?.extractedAt) {
    return null;
  }

  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {t("seoTitle")}
      </h2>

      {/* Documentation Quality Score */}
      {api.seoMetadata.docQualityScore !== null &&
      api.seoMetadata.docQualityScore !== undefined ? (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">
            {t("docQuality")}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(10)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < (api.seoMetadata?.docQualityScore || 0)
                      ? "text-[var(--accent-yellow)]"
                      : "text-[var(--border-dim)]"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="font-mono text-sm text-[var(--text-primary)]">
              {api.seoMetadata.docQualityScore}/10
            </span>
          </div>
        </div>
      ) : null}

      {/* Quality Indicators */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {api.seoMetadata.hasCodeExamples ? (
          <span className="ui-chip inline-flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {t("codeExamples")}
          </span>
        ) : null}
        {api.seoMetadata.h1 ? (
          <span className="ui-chip">{t("mainHeading")}</span>
        ) : null}
        {api.seoMetadata.ogImage ? (
          <span className="ui-chip">{t("openGraph")}</span>
        ) : null}
      </div>

      {/* Programming Languages */}
      {api.seoMetadata.languages && api.seoMetadata.languages.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-[var(--text-muted)]">
            {t("programmingLanguages")}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {api.seoMetadata.languages
              .map((l) => l?.language?.trim())
              .filter((l): l is string => !!l)
              .map((lang) => (
                <span
                  key={lang}
                  className="ui-chip inline-flex items-center gap-1 capitalize"
                >
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {lang}
                </span>
              ))}
          </div>
        </div>
      ) : null}

      {/* Keywords */}
      {api.seoMetadata.keywords && api.seoMetadata.keywords.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-[var(--text-muted)]">
            {t("keywords")}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {api.seoMetadata.keywords
              .map((k) => k?.keyword?.trim())
              .filter((k): k is string => !!k)
              .slice(0, 15)
              .map((keyword, idx) => (
                <span key={idx} className="ui-chip text-xs">
                  {keyword}
                </span>
              ))}
          </div>
        </div>
      ) : null}

      {/* Document Structure - H2s */}
      {api.seoMetadata.h2s && api.seoMetadata.h2s.length > 0 ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            {t("sectionHeadings")} ({api.seoMetadata.h2s.length})
          </summary>
          <ul className="mt-2 space-y-1 pl-4">
            {api.seoMetadata.h2s
              .map((h) => h?.heading?.trim())
              .filter((h): h is string => !!h)
              .map((heading, idx) => (
                <li key={idx} className="text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--accent-cyan)]">-</span> {heading}
                </li>
              ))}
          </ul>
        </details>
      ) : null}

      {/* Page Title & Description */}
      {(api.seoMetadata.title || api.seoMetadata.description) && (
        <div className="ui-surface-muted mt-4 rounded-lg p-4 text-xs">
          {api.seoMetadata.title ? (
            <div className="mb-2">
              <span className="font-semibold text-[var(--text-muted)]">
                {t("pageTitle")}:{" "}
              </span>
              <span className="text-[var(--text-secondary)]">
                {api.seoMetadata.title}
              </span>
            </div>
          ) : null}
          {api.seoMetadata.description ? (
            <div>
              <span className="font-semibold text-[var(--text-muted)]">
                {t("metaDescription")}:{" "}
              </span>
              <span className="text-[var(--text-secondary)]">
                {api.seoMetadata.description}
              </span>
            </div>
          ) : null}
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--text-muted)]">{t("seoNote")}</p>
    </section>
  );
}
