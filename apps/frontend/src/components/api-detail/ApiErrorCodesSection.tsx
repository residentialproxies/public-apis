import type { ErrorCodesSectionProps } from "./types";

const HTTP_STATUS_CODES = [
  {
    code: 200,
    color: "green",
    titleKey: "status200",
    descKey: "status200Desc",
  },
  {
    code: 400,
    color: "yellow",
    titleKey: "status400",
    descKey: "status400Desc",
  },
  {
    code: 401,
    color: "red",
    titleKey: "status401",
    descKey: "status401Desc",
  },
  {
    code: 403,
    color: "red",
    titleKey: "status403",
    descKey: "status403Desc",
  },
  {
    code: 429,
    color: "red",
    titleKey: "status429",
    descKey: "status429Desc",
  },
  {
    code: 500,
    color: "red",
    titleKey: "status500",
    descKey: "status500Desc",
  },
] as const;

const DEBUG_CHECKLIST_KEYS = [
  "debugCheckItem1",
  "debugCheckItem2",
  "debugCheckItem3",
  "debugCheckItem4",
  "debugCheckItem5",
  "debugCheckItem6",
  "debugCheckItem7",
] as const;

export function ApiErrorCodesSection({
  api,
  hasOpenApiSpec,
  t,
}: ErrorCodesSectionProps) {
  if (!hasOpenApiSpec) {
    return null;
  }

  const getStatusColor = (color: string) => {
    switch (color) {
      case "green":
        return "text-[var(--accent-green)] bg-[var(--accent-green)]/10";
      case "yellow":
        return "text-[var(--accent-yellow)] bg-[var(--accent-yellow)]/10";
      case "red":
        return "text-[var(--accent-red)] bg-[var(--accent-red)]/10";
      default:
        return "text-[var(--text-secondary)] bg-[var(--bg-secondary)]";
    }
  };

  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {t("errorCodesTitle")}
      </h2>
      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("commonHttpStatusCodes")}
          </h3>
          <div className="grid gap-3">
            {HTTP_STATUS_CODES.map((status) => (
              <div
                key={status.code}
                className="flex items-start gap-3 rounded-lg bg-[var(--bg-secondary)] p-3 border border-[var(--border-dim)]"
              >
                <span
                  className={`font-mono text-xs font-semibold ${getStatusColor(status.color)} px-2 py-1 rounded`}
                >
                  {status.code}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {t(status.titleKey)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    {t(status.descKey)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-[var(--accent-cyan)]/5 border border-[var(--accent-cyan)]/20 p-4">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-[var(--accent-cyan)] mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[var(--accent-cyan)] mb-2">
                {t("debugChecklist")}
              </div>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
                {DEBUG_CHECKLIST_KEYS.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {api.lastError && (
          <div className="rounded-lg bg-[var(--accent-red)]/5 border border-[var(--accent-red)]/20 p-4">
            <div className="text-sm font-semibold text-[var(--accent-red)] mb-2">
              {t("latestError")}
            </div>
            <pre className="text-xs text-[var(--text-secondary)] font-mono whitespace-pre-wrap break-words">
              {api.lastError}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
