"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const TerminalDots = () => (
  <div className="flex items-center gap-1.5" aria-hidden="true">
    <span className="size-3 rounded-full bg-[var(--accent-red)]" />
    <span className="size-3 rounded-full bg-[var(--accent-yellow)]" />
    <span className="size-3 rounded-full bg-[var(--accent-green)]" />
  </div>
);

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");

  const navLinks = [
    { href: "/search", label: t("search"), cmd: "grep", exact: false },
    { href: "/catalog", label: t("catalog"), cmd: "ls", exact: false },
    { href: "/about", label: t("about"), cmd: "cat", exact: false },
    { href: "/bot", label: t("bot"), cmd: "run", exact: false },
  ] as const;

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-dim)] bg-[var(--bg-secondary)]/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl">
        {/* Terminal title bar */}
        <div className="flex items-center justify-between border-b border-[var(--border-dim)]/50 px-4 py-2">
          <TerminalDots />
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {t("terminalTitle")}
          </span>
          <div className="w-[52px]" />
        </div>

        {/* Main header content */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label="Public API - Home"
          >
            <div className="relative flex size-10 items-center justify-center rounded-lg border border-[var(--accent-green)] bg-[var(--bg-primary)] transition-all duration-150 group-hover:scale-105 group-hover:shadow-[var(--glow-green)] group-active:scale-95">
              <span className="font-mono text-lg font-bold text-[var(--accent-green)] glow-text">
                {"</>"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-base font-semibold text-[var(--text-primary)]">
                {t("home")}
              </span>
              <span
                className="ml-1 inline-block h-4 w-2 animate-[blink_1s_infinite] bg-[var(--accent-green)]"
                aria-hidden="true"
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary navigation"
          >
            {navLinks.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-2 rounded px-3 py-2 font-mono text-sm transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-green)] ${
                    active
                      ? "text-[var(--accent-green)] bg-[var(--accent-green)]/10"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  <span
                    className={`transition-opacity ${active ? "text-[var(--accent-cyan)] opacity-100" : "text-[var(--accent-cyan)] opacity-60 group-hover:opacity-100"}`}
                  >
                    {link.cmd}
                  </span>
                  <span className="text-[var(--text-muted)]">&gt;</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <a
              className="group flex items-center gap-2 rounded px-3 py-2 font-mono text-sm text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-green)]"
              href="https://github.com/public-apis/public-apis"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-[var(--accent-purple)] opacity-60 transition-opacity group-hover:opacity-100">
                git
              </span>
              <span className="text-[var(--text-muted)]">&gt;</span>
              <span>{t("github")}</span>
              <svg
                className="size-3.5 text-[var(--text-dim)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              className="flex size-10 items-center justify-center rounded border border-[var(--border-dim)] bg-[var(--bg-primary)] font-mono text-lg text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] active:scale-95"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={isOpen}
              aria-controls="mobile-nav"
              type="button"
            >
              {isOpen ? "\u00D7" : "\u2261"}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav
          id="mobile-nav"
          className={`overflow-hidden border-t border-[var(--border-dim)]/50 transition-[max-height] duration-200 md:hidden ${isOpen ? "max-h-96" : "max-h-0"}`}
          aria-label="Mobile navigation"
        >
          <div className="space-y-1 p-4">
            {navLinks.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded px-3 py-2.5 font-mono text-sm transition-all hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-green)] ${
                    active
                      ? "text-[var(--accent-green)] bg-[var(--accent-green)]/10"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  <span className="text-[var(--accent-cyan)]">{link.cmd}</span>
                  <span className="text-[var(--text-muted)]">&gt;</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <a
              className="flex items-center gap-2 rounded px-3 py-2.5 font-mono text-sm text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-green)]"
              href="https://github.com/public-apis/public-apis"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-[var(--accent-purple)]">git</span>
              <span className="text-[var(--text-muted)]">&gt;</span>
              <span>{t("github")}</span>
              <svg
                className="size-3.5 text-[var(--text-dim)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
