import { formatDateTime } from "@/lib/format";
import type { KeySignalsSectionProps } from "./types";

export function ApiKeySignalsSection({ api, t }: KeySignalsSectionProps) {
  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {t("keySignals")}
      </h2>
      <div className="ui-surface-muted overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-[var(--border-dim)] text-sm">
          <tbody className="divide-y divide-[var(--border-dim)] bg-[var(--bg-secondary)]">
            <tr>
              <td className="px-4 py-2 text-[var(--text-secondary)]">
                {t("signalAuth")}
              </td>
              <td className="px-4 py-2 font-mono text-[var(--accent-green)]">
                {api.auth}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-[var(--text-secondary)]">
                {t("signalCors")}
              </td>
              <td className="px-4 py-2 font-mono text-[var(--accent-green)]">
                {api.cors}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-[var(--text-secondary)]">
                {t("signalHttps")}
              </td>
              <td className="px-4 py-2 font-mono text-[var(--accent-green)]">
                {api.https ? t("yes") : t("no")}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-[var(--text-secondary)]">
                {t("signalLastChecked")}
              </td>
              <td className="px-4 py-2 font-mono text-[var(--accent-green)]">
                {formatDateTime(api.lastCheckedAt) ?? t("notChecked")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {t("signalsNote")}
      </p>
    </section>
  );
}
