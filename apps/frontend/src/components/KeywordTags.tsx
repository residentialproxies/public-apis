"use client";

import { memo, useState } from "react";

type Keyword = {
  keyword?: string | null;
};

type KeywordTagsProps = {
  keywords: Keyword[] | string[];
  title?: string;
  maxDisplay?: number;
  expandable?: boolean;
  size?: "sm" | "md";
  className?: string;
};

function KeywordTagsComponent({
  keywords,
  title,
  maxDisplay = 15,
  expandable = true,
  size = "md",
  className = "",
}: KeywordTagsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const validKeywords = keywords
    .map((k) => (typeof k === "string" ? k : k.keyword?.trim() || ""))
    .filter((k) => k.length > 0);

  if (validKeywords.length === 0) {
    return null;
  }

  const displayCount = isExpanded ? validKeywords.length : maxDisplay;
  const displayKeywords = validKeywords.slice(0, displayCount);
  const remainingCount = validKeywords.length - maxDisplay;
  const canExpand = expandable && remainingCount > 0;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
  };

  return (
    <div className={className}>
      {title && (
        <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">
          {title}
        </h3>
      )}
      <div className="flex flex-wrap gap-2" role="list" aria-label="Keywords">
        {displayKeywords.map((keyword, idx) => (
          <span
            key={idx}
            role="listitem"
            className={`ui-chip text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-green)] transition-colors cursor-default ${sizeClasses[size]}`}
          >
            {keyword}
          </span>
        ))}
        {canExpand && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className={`ui-chip text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors cursor-pointer ${sizeClasses[size]}`}
            aria-expanded={isExpanded}
            aria-label={`Show ${remainingCount} more keywords`}
          >
            +{remainingCount} more
          </button>
        )}
        {canExpand && isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className={`ui-chip text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors cursor-pointer ${sizeClasses[size]}`}
            aria-expanded={isExpanded}
            aria-label="Show fewer keywords"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

export const KeywordTags = memo(KeywordTagsComponent);
