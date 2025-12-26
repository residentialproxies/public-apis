import { Link } from "@/i18n/navigation";
import { TerminalWindow } from "@/components/TerminalWindow";

interface CatalogErrorProps {
  t: (key: string) => string;
  errorMessage: string;
}

export function CatalogError({ t, errorMessage }: CatalogErrorProps) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <TerminalWindow title={t("errorTitle")}>
        <div className="p-6">
          <div className="font-mono text-sm">
            <span className="text-[var(--accent-red)]">ERROR</span>
            <span className="text-[var(--text-muted)]">:</span>
            <span className="ml-2 text-[var(--text-primary)]">
              {t("errorMessage")}
            </span>
          </div>
          <p className="mt-2 font-mono text-sm text-[var(--text-muted)]">
            <span className="text-[var(--accent-cyan)]">$</span>{" "}
            {t("errorDesc")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="terminal-btn terminal-btn-primary" href="/catalog">
              <span className="text-[var(--bg-primary)]">{t("retry")}</span>
            </Link>
            <Link className="terminal-btn terminal-btn-secondary" href="/about">
              <span>{t("help")}</span>
            </Link>
          </div>

          {process.env.NODE_ENV !== "production" ? (
            <div className="mt-6 rounded border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/5 p-4 font-mono text-xs">
              <div className="text-[var(--accent-red)]">{`// Debug Output`}</div>
              <pre className="mt-2 whitespace-pre-wrap break-words text-[var(--text-muted)]">
                {errorMessage}
              </pre>
            </div>
          ) : null}
        </div>
      </TerminalWindow>
    </main>
  );
}
