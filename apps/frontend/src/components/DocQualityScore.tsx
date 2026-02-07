"use client";

import { memo } from "react";

type DocQualityScoreProps = {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
};

function DocQualityScoreComponent({
  score,
  maxScore = 10,
  size = "md",
  showLabel = true,
  label,
  className = "",
}: DocQualityScoreProps) {
  const normalizedScore = Math.min(Math.max(score, 0), maxScore);
  const percentage = (normalizedScore / maxScore) * 100;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const getScoreColor = (pct: number): string => {
    if (pct >= 80) return "text-[var(--accent-green)]";
    if (pct >= 60) return "text-[var(--accent-cyan)]";
    if (pct >= 40) return "text-[var(--accent-yellow)]";
    if (pct >= 20) return "text-[var(--accent-orange)]";
    return "text-[var(--accent-red)]";
  };

  const getScoreLabel = (pct: number): string => {
    if (pct >= 80) return "Excellent";
    if (pct >= 60) return "Good";
    if (pct >= 40) return "Fair";
    if (pct >= 20) return "Poor";
    return "Very Poor";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && label && (
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      )}
      <div className="flex items-center gap-1">
        {/* Star rating */}
        <div className="flex items-center" role="img" aria-label={`${normalizedScore} out of ${maxScore} stars`}>
          {[...Array(maxScore)].map((_, i) => (
            <svg
              key={i}
              className={`${sizeClasses[size]} transition-colors ${
                i < normalizedScore
                  ? "text-[var(--accent-yellow)]"
                  : "text-[var(--border-dim)]"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Numeric score */}
        <span className={`font-mono ${textSizeClasses[size]} ${getScoreColor(percentage)}`}>
          {normalizedScore}/{maxScore}
        </span>
      </div>

      {/* Quality label badge */}
      {showLabel && (
        <span
          className={`ui-chip text-xs ${getScoreColor(percentage)}`}
          style={{
            background: `color-mix(in srgb, currentColor 10%, transparent)`,
          }}
        >
          {getScoreLabel(percentage)}
        </span>
      )}
    </div>
  );
}

export const DocQualityScore = memo(DocQualityScoreComponent);
