import type { AuthenticationSectionProps } from "./types";

export function ApiAuthenticationSection({
  api,
  t,
}: AuthenticationSectionProps) {
  if (!api.auth || api.auth === "No") {
    return null;
  }

  const getAuthDescription = () => {
    switch (api.auth) {
      case "apiKey":
        return t("authDescApiKey");
      case "OAuth":
        return t("authDescOAuth");
      case "X-Mashape-Key":
        return t("authDescMashape");
      case "User-Agent":
        return t("authDescUserAgent");
      default:
        return t("authDescOther");
    }
  };

  const getCodeExample = () => {
    // Helper to create code examples with proper escaping
    const jsCode = `fetch('${api.link}', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
})`;

    switch (api.auth) {
      case "apiKey":
        return (
          <div className="space-y-2">
            <div className="text-[var(--text-muted)]"># Using cURL</div>
            <div className="text-[var(--text-secondary)]">
              curl -H &quot;Authorization: Bearer YOUR_API_KEY&quot; {api.link}
            </div>
            <div className="mt-3 text-[var(--text-muted)]">
              # Using JavaScript
            </div>
            <div className="text-[var(--text-secondary)]">{jsCode}</div>
          </div>
        );
      case "OAuth":
        return (
          <div className="space-y-2">
            <div className="text-[var(--text-muted)]">
              # Step 1: Obtain authorization code
            </div>
            <div className="text-[var(--text-secondary)]">
              GET
              /oauth/authorize?client_id=YOUR_CLIENT_ID&amp;redirect_uri=YOUR_CALLBACK
            </div>
            <div className="mt-3 text-[var(--text-muted)]">
              # Step 2: Exchange code for token
            </div>
            <div className="text-[var(--text-secondary)]">
              POST /oauth/token
              <br />
              client_id=YOUR_CLIENT_ID&amp;client_secret=YOUR_SECRET&amp;code=AUTH_CODE
            </div>
          </div>
        );
      case "X-Mashape-Key":
        return (
          <div className="space-y-2">
            <div className="text-[var(--text-muted)]"># Using cURL</div>
            <div className="text-[var(--text-secondary)]">
              curl -H &quot;X-Mashape-Key: YOUR_KEY&quot; {api.link}
            </div>
          </div>
        );
      case "User-Agent":
        return (
          <div className="space-y-2">
            <div className="text-[var(--text-muted)]"># Using cURL</div>
            <div className="text-[var(--text-secondary)]">
              curl -H &quot;User-Agent: YourApp/1.0&quot; {api.link}
            </div>
          </div>
        );
      default:
        return (
          <div className="text-[var(--text-secondary)]">
            {t("authCodeExampleFallback")}
          </div>
        );
    }
  };

  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        🔐 {t("authGuide")}
      </h2>
      <div className="space-y-4">
        <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--border-dim)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {t("authType")}
            </span>
            <span className="ui-chip bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
              {api.auth}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {getAuthDescription()}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("commonImplementation")}
          </h3>
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-4 font-mono text-xs overflow-x-auto">
            {getCodeExample()}
          </div>
        </div>

        <div className="rounded-lg bg-[var(--accent-yellow)]/5 border border-[var(--accent-yellow)]/20 p-4">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-[var(--accent-yellow)] mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[var(--accent-yellow)] mb-1">
                {t("securityBestPractices")}
              </div>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc list-inside">
                <li>{t("securityPractice1")}</li>
                <li>{t("securityPractice2")}</li>
                <li>{t("securityPractice3")}</li>
                <li>{t("securityPractice4")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
