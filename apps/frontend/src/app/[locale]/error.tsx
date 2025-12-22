"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type ErrorCategory = "network" | "server" | "client" | "unknown";

function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();

  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("failed to load")
  ) {
    return "network";
  }

  if (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("server")
  ) {
    return "server";
  }

  if (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("undefined") ||
    message.includes("null")
  ) {
    return "client";
  }

  return "unknown";
}

const ASCII_SKULL = `
    ___________
   /           \\
  |  X     X  |
  |     ^     |
  |   \\___/   |
   \\_________/
`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  const category = useMemo(() => categorizeError(error), [error]);

  const errorInfo = useMemo(() => {
    switch (category) {
      case "network":
        return {
          title: t("networkTitle"),
          code: t("networkCode"),
          description: t("networkDesc"),
          suggestion: t("networkSuggestion"),
        };
      case "server":
        return {
          title: t("serverTitle"),
          code: t("serverCode"),
          description: t("serverDesc"),
          suggestion: t("serverSuggestion"),
        };
      case "client":
        return {
          title: t("clientTitle"),
          code: t("clientCode"),
          description: t("clientDesc"),
          suggestion: t("clientSuggestion"),
        };
      default:
        return {
          title: t("unknownTitle"),
          code: t("unknownCode"),
          description: t("unknownDesc"),
          suggestion: t("unknownSuggestion"),
        };
    }
  }, [category, t]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("Application error:", {
        message: error.message,
        digest: error.digest,
        category,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "unknown",
      });
    } else {
      console.error("Application error:", error);
    }
  }, [error, category]);

  const reportUrl = useMemo(() => {
    const params = new URLSearchParams({
      title: `Error: ${errorInfo.title}`,
      body: `## Error Details\n\n- **Category**: ${category}\n- **Error ID**: ${error.digest ?? "N/A"}\n- **URL**: ${typeof window !== "undefined" ? window.location.href : "N/A"}\n- **Time**: ${new Date().toISOString()}\n\n## Additional Context\n\n[Please describe what you were doing when this error occurred]`,
      labels: "bug",
    });
    return `https://github.com/public-apis/public-apis/issues/new?${params.toString()}`;
  }, [category, error.digest, errorInfo.title]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-6 py-16">
      <section className="w-full max-w-lg terminal-surface overflow-hidden">
        {/* Terminal header */}
        <div className="terminal-header rounded-t-lg">
          <div className="flex items-center gap-1.5">
            <span className="terminal-dot terminal-dot-red" />
            <span className="terminal-dot terminal-dot-yellow" />
            <span className="terminal-dot terminal-dot-green" />
          </div>
          <span className="ml-3 font-mono text-xs text-[var(--text-muted)]">
            {t("terminalTitle")} -- {errorInfo.code}
          </span>
        </div>

        <div className="p-6">
          {/* ASCII skull art */}
          <pre className="mx-auto mb-4 text-center font-mono text-[10px] leading-none text-[var(--accent-red)] opacity-80">
            {ASCII_SKULL}
          </pre>

          {/* Error title */}
          <div className="mb-4 text-center">
            <h1 className="font-mono text-lg font-bold text-[var(--accent-red)] glow-text">
              {t("fatal")} {errorInfo.title}
            </h1>
          </div>

          {/* Error details */}
          <div className="mb-6 rounded border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/5 p-4 font-mono text-xs">
            <div className="text-[var(--accent-red)]">{t("errorOutput")}</div>
            <p className="mt-2 text-[var(--text-muted)]">
              {errorInfo.description}
            </p>
            <p className="mt-3 text-[var(--accent-cyan)]">
              {errorInfo.suggestion}
            </p>
          </div>

          {error.digest && (
            <p className="mb-4 text-center font-mono text-xs text-[var(--text-dim)]">
              <span className="text-[var(--accent-purple)]">
                {t("digest")}:
              </span>{" "}
              {error.digest}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="terminal-btn terminal-btn-primary"
            >
              <span className="text-[var(--bg-primary)]">{t("retry")}</span>
            </button>

            <Link href="/" className="terminal-btn terminal-btn-secondary">
              {t("home")}
            </Link>
          </div>

          {/* Report link */}
          <div className="mt-6 border-t border-[var(--border-dim)] pt-4 text-center">
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-xs text-[var(--text-dim)] transition-colors hover:text-[var(--accent-green)]"
            >
              <span className="text-[var(--accent-orange)]">git</span>
              <span>&gt;</span>
              <span>{t("reportIssue")}</span>
              <svg
                className="size-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Glitch overlay */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <div className="absolute inset-0 bg-[var(--accent-red)]/5" />
      </div>
    </main>
  );
}
