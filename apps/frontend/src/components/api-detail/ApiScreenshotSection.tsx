import { ApiScreenshot } from "@/components/ApiScreenshot";
import type { ScreenshotSectionProps } from "./types";

export function ApiScreenshotSection({
  api,
  canonicalSlug,
  t,
}: ScreenshotSectionProps) {
  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {t("livePreview")}
      </h2>
      <div className="mt-4">
        <ApiScreenshot
          thumbnailUrl={
            api.screenshot?.thumbnailUrl || `/screenshots/${canonicalSlug}.webp`
          }
          fullUrl={
            api.screenshot?.fullUrl || `/screenshots/${canonicalSlug}.webp`
          }
          apiName={api.name}
          capturedAt={api.screenshot?.capturedAt}
        />
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {t("screenshotNote")}
      </p>
    </section>
  );
}
