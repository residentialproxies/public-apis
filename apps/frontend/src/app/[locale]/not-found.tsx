"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const ASCII_404 = `
██╗  ██╗ ██████╗ ██╗  ██╗
██║  ██║██╔═══██╗██║  ██║
███████║██║   ██║███████║
╚════██║██║   ██║╚════██║
     ██║╚██████╔╝     ██║
     ╚═╝ ╚═════╝      ╚═╝
`;

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6 py-20">
      <section className="w-full terminal-surface overflow-hidden">
        {/* Terminal header */}
        <div className="terminal-header rounded-t-lg">
          <div className="flex items-center gap-1.5">
            <span className="terminal-dot terminal-dot-red" />
            <span className="terminal-dot terminal-dot-yellow" />
            <span className="terminal-dot terminal-dot-green" />
          </div>
          <span className="ml-3 font-mono text-xs text-[var(--text-muted)]">
            {t("terminalTitle")}
          </span>
        </div>

        <div className="p-8 text-center">
          {/* ASCII 404 */}
          <pre className="mx-auto mb-6 font-mono text-[8px] leading-none text-[var(--accent-yellow)] sm:text-[10px]">
            {ASCII_404}
          </pre>

          {/* Terminal output */}
          <div className="mb-6 text-left font-mono text-sm">
            <p className="text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {t("catCommand")}
            </p>
            <p className="mt-2 text-[var(--accent-red)]">{t("errorMessage")}</p>
            <p className="mt-4 text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              <span className="text-[var(--text-primary)]">{t("message")}</span>
              <span className="ml-1 inline-block h-4 w-2 animate-[blink_1s_infinite] bg-[var(--accent-green)]" />
            </p>
          </div>

          {/* Action */}
          <div>
            <Link href="/" className="terminal-btn terminal-btn-primary">
              <span className="text-[var(--bg-primary)]">{t("backHome")}</span>
            </Link>
          </div>

          {/* Hint */}
          <p className="mt-6 font-mono text-xs text-[var(--text-dim)]">
            <span className="text-[var(--accent-purple)]">hint:</span>{" "}
            {t("hint")}
          </p>
        </div>
      </section>
    </main>
  );
}
