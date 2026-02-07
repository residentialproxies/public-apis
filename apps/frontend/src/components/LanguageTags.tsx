"use client";

import React, { memo } from "react";

type Language = {
  language?: string | null;
  confidence?: number | null;
};

type LanguageTagsProps = {
  languages: Language[];
  title?: string;
  maxDisplay?: number;
  showConfidence?: boolean;
  size?: "sm" | "md";
  className?: string;
};

// Language color mapping for visual distinction
const languageColors: Record<string, string> = {
  javascript: "var(--accent-yellow)",
  typescript: "var(--accent-cyan)",
  python: "var(--accent-green)",
  java: "var(--accent-orange)",
  go: "var(--accent-cyan)",
  rust: "var(--accent-orange)",
  ruby: "var(--accent-red)",
  php: "var(--accent-purple)",
  csharp: "var(--accent-purple)",
  "c#": "var(--accent-purple)",
  swift: "var(--accent-orange)",
  kotlin: "var(--accent-purple)",
  shell: "var(--accent-green)",
  bash: "var(--accent-green)",
  curl: "var(--accent-cyan)",
  sql: "var(--accent-pink)",
  html: "var(--accent-orange)",
  css: "var(--accent-cyan)",
  json: "var(--accent-yellow)",
  xml: "var(--accent-orange)",
  yaml: "var(--accent-green)",
  graphql: "var(--accent-pink)",
  r: "var(--accent-cyan)",
  scala: "var(--accent-red)",
  elixir: "var(--accent-purple)",
  dart: "var(--accent-cyan)",
  lua: "var(--accent-cyan)",
  perl: "var(--accent-cyan)",
  haskell: "var(--accent-purple)",
  clojure: "var(--accent-green)",
  objective_c: "var(--accent-cyan)",
  "objective-c": "var(--accent-cyan)",
};

// Language icons (simplified SVG paths)
const getLanguageIcon = (lang: string): React.ReactElement => {
  const normalizedLang = lang.toLowerCase().replace(/[^a-z]/g, "");

  // Default code icon
  return (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const getLanguageColor = (lang: string): string => {
  const normalizedLang = lang.toLowerCase().replace(/[^a-z#]/g, "");
  return languageColors[normalizedLang] || "var(--accent-green)";
};

function LanguageTagsComponent({
  languages,
  title,
  maxDisplay = 10,
  showConfidence = false,
  size = "md",
  className = "",
}: LanguageTagsProps) {
  const validLanguages = languages
    .map((l) => ({
      name: l.language?.trim() || "",
      confidence: l.confidence ?? null,
    }))
    .filter((l) => l.name.length > 0);

  if (validLanguages.length === 0) {
    return null;
  }

  const displayLanguages = validLanguages.slice(0, maxDisplay);
  const remainingCount = validLanguages.length - maxDisplay;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
  };

  return (
    <div className={className}>
      {title && (
        <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">
          {title}
        </h3>
      )}
      <div className="flex flex-wrap gap-2" role="list" aria-label="Supported programming languages">
        {displayLanguages.map((lang, idx) => {
          const color = getLanguageColor(lang.name);
          return (
            <span
              key={idx}
              role="listitem"
              className={`ui-chip inline-flex items-center capitalize ${sizeClasses[size]}`}
              style={{
                borderColor: color,
                color: color,
                background: `color-mix(in srgb, ${color} 10%, transparent)`,
              }}
            >
              {getLanguageIcon(lang.name)}
              <span>{lang.name}</span>
              {showConfidence && lang.confidence !== null && (
                <span className="text-[var(--text-muted)] ml-1">
                  ({Math.round(lang.confidence * 100)}%)
                </span>
              )}
            </span>
          );
        })}
        {remainingCount > 0 && (
          <span
            className={`ui-chip text-[var(--text-muted)] ${sizeClasses[size]}`}
          >
            +{remainingCount} more
          </span>
        )}
      </div>
    </div>
  );
}

export const LanguageTags = memo(LanguageTagsComponent);
