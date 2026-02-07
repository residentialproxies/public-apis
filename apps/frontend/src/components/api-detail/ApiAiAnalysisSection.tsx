import type { AiAnalysisSectionProps } from "./types";

export function ApiAiAnalysisSection({ api, t }: AiAnalysisSectionProps) {
  const hasAnalysis = api.aiAnalysis?.summary || api.aiAnalysis?.useCases?.length;

  if (!hasAnalysis) {
    return null;
  }

  const useCaseTags = api.aiAnalysis?.useCases
    ?.map((useCase) => useCase?.tag?.trim())
    .filter((tag): tag is string => !!tag)
    .slice(0, 15) || [];

  // Group use cases by category if possible
  const categorizedUseCases = categorizeUseCases(useCaseTags);

  return (
    <section className="ui-surface mt-6 p-6">
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-[var(--accent-purple)]"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("aiAnalysis")}
        </h2>
        <span className="ui-chip text-xs bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] border-[var(--accent-purple)]/30">
          AI
        </span>
      </div>

      {/* Summary */}
      {api.aiAnalysis?.summary && (
        <div className="mt-4 ui-surface-muted rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-4 w-4 text-[var(--accent-cyan)] shrink-0 mt-0.5"
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
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {api.aiAnalysis.summary}
            </p>
          </div>
        </div>
      )}

      {/* Use Cases */}
      {useCaseTags.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
            <svg
              className="h-3.5 w-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            {t("useCases")}
          </h3>

          {Object.keys(categorizedUseCases).length > 1 ? (
            // Show categorized view if we have multiple categories
            <div className="space-y-3">
              {Object.entries(categorizedUseCases).map(([category, tags]) => (
                <div key={category}>
                  <span className="text-xs text-[var(--text-dim)] uppercase tracking-wide">
                    {category}
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="ui-chip text-xs hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Simple flat view
            <div className="flex flex-wrap gap-2">
              {useCaseTags.map((tag) => (
                <span
                  key={tag}
                  className="ui-chip text-xs hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Note */}
      <p className="mt-4 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
        <svg
          className="h-3 w-3"
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
        {t("aiAnalysisNote")}
      </p>
    </section>
  );
}

// Helper function to categorize use cases
function categorizeUseCases(tags: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {};

  // Keywords for categorization
  const categoryKeywords: Record<string, string[]> = {
    "Data & Analytics": ["data", "analytics", "statistics", "metrics", "reporting", "dashboard"],
    "Integration": ["integration", "sync", "connect", "webhook", "automation"],
    "Development": ["development", "testing", "debugging", "sdk", "library"],
    "Business": ["business", "enterprise", "commerce", "payment", "billing"],
    "Communication": ["email", "sms", "notification", "messaging", "chat"],
    "Media": ["image", "video", "audio", "media", "file", "storage"],
    "Security": ["security", "auth", "encryption", "compliance"],
  };

  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();
    let assigned = false;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lowerTag.includes(kw))) {
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(tag);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      if (!categories["General"]) {
        categories["General"] = [];
      }
      categories["General"].push(tag);
    }
  }

  // If all tags ended up in one category, just return them flat
  const categoryCount = Object.keys(categories).length;
  if (categoryCount === 1) {
    return { "": Object.values(categories).flat() };
  }

  return categories;
}
