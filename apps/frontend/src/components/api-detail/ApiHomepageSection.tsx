import { CopyButton } from "@/components/CopyButton";
import type { HomepageSectionProps } from "./types";

export function ApiHomepageSection({ api, t }: HomepageSectionProps) {
  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {t("homepage")}
      </h2>
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <a
          className="break-all text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          href={api.link}
          target="_blank"
          rel="noreferrer"
        >
          {api.link}
        </a>
        <div className="flex items-center gap-2">
          <CopyButton label={t("copyUrl")} value={api.link} />
          <CopyButton label={t("copyCurl")} value={`curl -I ${api.link}`} />
        </div>
      </div>

      {api.lastError ? (
        <div className="ui-surface-muted mt-4 rounded-xl p-3 text-xs text-[var(--text-secondary)]">
          <div className="font-semibold text-[var(--text-primary)]">
            {t("lastError")}
          </div>
          <pre className="mt-2 whitespace-pre-wrap break-words font-mono">
            {api.lastError}
          </pre>
        </div>
      ) : null}

      <p className="mt-5 text-xs text-[var(--text-muted)]">
        {t("availabilityNote")}
      </p>
    </section>
  );
}
