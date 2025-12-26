import { CopyButton } from "@/components/CopyButton";
import type { OpenApiSectionProps } from "./types";

export function ApiOpenApiSection({ api, t }: OpenApiSectionProps) {
  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {t("openApi")}
      </h2>

      {api.openapiUrl ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <a
              className="break-all text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
              href={api.openapiUrl}
              target="_blank"
              rel="noreferrer"
            >
              {api.openapiUrl}
            </a>
            <div className="flex items-center gap-2">
              <CopyButton label={t("copyUrl")} value={api.openapiUrl} />
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)]">{t("openApiNote")}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          {t("noOpenApi")}
        </p>
      )}
    </section>
  );
}
