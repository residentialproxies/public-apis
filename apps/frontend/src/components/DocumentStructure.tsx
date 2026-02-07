"use client";

import { memo, useState } from "react";

type Heading = {
  heading?: string | null;
  level?: number;
};

type DocumentStructureProps = {
  headings: Heading[] | string[];
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  maxDisplay?: number;
  className?: string;
};

function DocumentStructureComponent({
  headings,
  title,
  collapsible = true,
  defaultExpanded = false,
  maxDisplay = 20,
  className = "",
}: DocumentStructureProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const validHeadings = headings
    .map((h) => {
      if (typeof h === "string") {
        return { text: h.trim(), level: 2 };
      }
      return {
        text: h.heading?.trim() || "",
        level: h.level || 2,
      };
    })
    .filter((h) => h.text.length > 0);

  if (validHeadings.length === 0) {
    return null;
  }

  const displayHeadings = validHeadings.slice(0, maxDisplay);
  const hasMore = validHeadings.length > maxDisplay;

  const content = (
    <ul className="space-y-1.5 pl-1" role="list" aria-label="Document sections">
      {displayHeadings.map((heading, idx) => (
        <li
          key={idx}
          className="flex items-start gap-2 text-xs text-[var(--text-secondary)] group"
          style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
        >
          <span className="text-[var(--accent-cyan)] shrink-0 mt-0.5">
            {heading.level === 2 ? (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="inline-block w-3 text-center">-</span>
            )}
          </span>
          <span className="group-hover:text-[var(--text-primary)] transition-colors">
            {heading.text}
          </span>
        </li>
      ))}
      {hasMore && (
        <li className="text-xs text-[var(--text-muted)] pl-5">
          ... and {validHeadings.length - maxDisplay} more sections
        </li>
      )}
    </ul>
  );

  if (!collapsible) {
    return (
      <div className={className}>
        {title && (
          <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-3">
            {title}
          </h3>
        )}
        {content}
      </div>
    );
  }

  return (
    <details
      className={className}
      open={isExpanded}
      onToggle={(e) => setIsExpanded(e.currentTarget.open)}
    >
      <summary className="cursor-pointer text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-2 select-none transition-colors">
        <svg
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span>
          {title || "Document Structure"} ({validHeadings.length})
        </span>
      </summary>
      <div className="mt-3">{content}</div>
    </details>
  );
}

export const DocumentStructure = memo(DocumentStructureComponent);
