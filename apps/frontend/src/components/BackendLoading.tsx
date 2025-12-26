"use client";

import { useTranslations } from "next-intl";

type BackendLoadingProps = {
  message?: string;
};

/**
 * BackendLoading Component
 * Displays a loading state when the backend is being contacted
 */
export function BackendLoading({ message }: BackendLoadingProps) {
  const t = useTranslations("backendLoading");
  const tCommon = useTranslations("common");

  // Handle cross-namespace translation keys
  const getDisplayMessage = (): string => {
    if (!message) return t("connecting");

    // If message contains a dot, it's a cross-namespace key like "common.loading"
    if (message.includes(".")) {
      const [namespace, ...keyParts] = message.split(".");
      const key = keyParts.join(".");
      // Use the appropriate translation function
      if (namespace === "common") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return tCommon(key as any);
      }
      // For other namespaces, you could extend this logic
      return message;
    }

    return message;
  };

  const displayMessage = getDisplayMessage();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-lg border border-[var(--border-dim)] bg-[var(--bg-secondary)] p-8">
        {/* Spinner and message */}
        <div className="flex items-center gap-4">
          {/* Spinner */}
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--border-dim)] border-t-[var(--accent-cyan)]" />
          </div>

          <div className="flex-1">
            <div className="font-mono text-sm text-[var(--text-primary)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {displayMessage}
            </div>
            <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">
              {t("fetchingData")}
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="mt-6 space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-[var(--accent-green)]">
            <span>✓</span>
            <span>{t("initializing")}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--accent-cyan)] animate-pulse">
            <span>⋯</span>
            <span>{t("loadingData")}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-dim)]">
            <span>○</span>
            <span>{t("renderingPage")}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
