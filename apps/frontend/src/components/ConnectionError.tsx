"use client";

import { useTranslations } from "next-intl";
import { getErrorMessage, isConnectionError } from "@/lib/errors";
import { getCmsBaseUrl } from "@/lib/config";

type Props = {
  error: Error | unknown;
  retryUrl?: string;
  title?: string;
};

export function ConnectionError({ error, retryUrl, title }: Props) {
  const t = useTranslations("connectionError");
  const errorMessage = getErrorMessage(error);
  const cmsUrl = getCmsBaseUrl();
  const isConnectionErr = isConnectionError(error);
  const displayTitle = title || t("defaultTitle");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-lg border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/5 p-8">
        {/* Error header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-red)]/10">
            <svg
              className="size-6 text-[var(--accent-red)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {displayTitle}
            </h1>
            <p className="font-mono text-sm text-[var(--text-muted)]">
              {t("cannotConnect")}
            </p>
          </div>
        </div>

        {/* Error message */}
        <div className="mb-6 rounded border border-[var(--border-dim)] bg-[var(--bg-primary)] p-4 font-mono text-sm">
          <div className="text-[var(--accent-red)]">{t("errorLabel")}</div>
          <div className="mt-1 text-[var(--text-primary)]">{errorMessage}</div>
          {error instanceof Error && error.message && (
            <div className="mt-2 text-xs text-[var(--text-muted)]">
              {error.message}
            </div>
          )}
        </div>

        {/* Troubleshooting steps */}
        <div className="rounded border border-[var(--accent-yellow)]/30 bg-[var(--accent-yellow)]/5 p-4">
          <h2 className="mb-3 font-semibold text-[var(--accent-yellow)]">
            {t("troubleshooting")}
          </h2>
          <ul className="space-y-2 font-mono text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-cyan)]">1.</span>
              <span>
                {t("troubleshootingStep1")}{" "}
                <code className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5">
                  cd apps/backend && pnpm dev
                </code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-cyan)]">2.</span>
              <span>
                {t("troubleshootingStep2")}{" "}
                <code className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5">
                  apps/frontend/.env.local
                </code>
                :
              </span>
            </li>
            <li className="ml-6">
              <code className="rounded bg-[var(--bg-tertiary)] px-2 py-1 text-xs">
                NEXT_PUBLIC_CMS_URL={cmsUrl}
              </code>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-cyan)]">3.</span>
              <span>
                {t("troubleshootingStep3")} {new URL(cmsUrl).port}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-cyan)]">4.</span>
              <span>{t("troubleshootingStep4")}</span>
            </li>
          </ul>
        </div>

        {/* Retry button */}
        {retryUrl && (
          <div className="mt-6">
            <a
              href={retryUrl}
              className="inline-flex items-center gap-2 rounded border border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 px-4 py-2 font-mono text-sm text-[var(--accent-cyan)] transition-colors hover:bg-[var(--accent-cyan)]/20"
            >
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t("retryRequest")}
            </a>
          </div>
        )}

        {/* Additional debug info */}
        {isDevelopment() && (
          <details className="mt-6">
            <summary className="cursor-pointer font-mono text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {t("debugInfo")}
            </summary>
            <div className="mt-3 rounded border border-[var(--border-dim)] bg-[var(--bg-tertiary)] p-3 font-mono text-xs">
              <div className="mb-2 text-[var(--text-muted)]">
                {t("backendUrl")} {cmsUrl}
              </div>
              <div className="mb-2 text-[var(--text-muted)]">
                {t("environment")} {process.env.NODE_ENV}
              </div>
              <div className="text-[var(--text-muted)]">
                {t("connectionType")}{" "}
                {isConnectionErr
                  ? t("connectionTypeError")
                  : t("connectionTypeErrorOther")}
              </div>
              {error instanceof Error && (
                <div className="mt-2 text-[var(--text-muted)]">
                  <div>
                    {t("errorName")} {error.name}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-[var(--text-dim)]">
                    {error.stack}
                  </div>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </main>
  );
}

function isDevelopment() {
  return process.env.NODE_ENV === "development";
}
