"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

type CodeBlockProps = {
  code: string;
  language: string;
  filename?: string;
  highlightLines?: number[];
  className?: string;
  showLineNumbers?: boolean;
};

export function CodeBlock({
  code,
  language,
  filename,
  highlightLines = [],
  className = "",
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const lines = code.split("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`code-block-container ${className}`}>
      {/* Header with filename and copy button */}
      <div className="flex items-center justify-between px-4 py-2 ui-surface-muted border-b border-[var(--border-dim)]">
        {filename ? (
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {filename}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)] capitalize">
            {language}
          </span>
        )}
        <CopyButton label={copied ? "Copied!" : "Copy"} value={code} />
      </div>

      {/* Code content */}
      <div className="relative overflow-x-auto ui-surface">
        <pre className="p-4">
          <code
            className={`language-${language} text-xs font-mono text-[var(--text-primary)] block`}
          >
            {showLineNumbers
              ? lines.map((line, idx) => {
                  const lineNumber = idx + 1;
                  const isHighlighted = highlightLines.includes(lineNumber);
                  return (
                    <div
                      key={idx}
                      className={`flex ${isHighlighted ? "bg-[var(--accent-yellow)]/10 border-l-2 border-[var(--accent-yellow)]" : ""}`}
                    >
                      <span className="inline-block w-12 text-right pr-4 text-[var(--text-muted)] select-none">
                        {lineNumber}
                      </span>
                      <span className="flex-1">{line || "\n"}</span>
                    </div>
                  );
                })
              : code}
          </code>
        </pre>
      </div>

      {/* Language indicator badge */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs text-[var(--text-muted)] opacity-50">
        {language}
      </div>
    </div>
  );
}
