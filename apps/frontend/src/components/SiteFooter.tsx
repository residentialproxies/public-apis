"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const ASCII_LOGO = `
██████╗  █████╗
██╔══██╗██╔══██╗
██████╔╝███████║
██╔═══╝ ██╔══██║
██║     ██║  ██║
╚═╝     ╚═╝  ╚═╝
`;

export function SiteFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tA11y = useTranslations("accessibility");
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { href: "/", label: tNav("catalog") },
    { href: "/about", label: tNav("about") },
    { href: "/bot", label: tNav("bot") },
    { href: "/trust", label: "Trust Policy" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ];

  const externalLinks = [
    {
      href: "https://github.com/public-apis/public-apis",
      label: t("githubRepo"),
      external: true,
    },
    {
      href: "/sitemap-index.xml",
      label: "Sitemap Index",
      external: false,
    },
    {
      href: "/sitemap.xml",
      label: t("sitemap"),
      external: false,
    },
    {
      href: "/sitemap-images.xml",
      label: "Image Sitemap",
      external: false,
    },
    {
      href: "/feed.xml",
      label: "RSS Feed",
      external: false,
    },
    {
      href: "/feed.atom",
      label: "Atom Feed",
      external: false,
    },
    {
      href: "mailto:info@public-api.org",
      label: t("contact"),
      external: true,
    },
  ];

  return (
    <footer
      className="border-t border-[var(--border-dim)] bg-[var(--bg-secondary)]"
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <pre
              className="ascii-art text-[8px] leading-[1.1] text-[var(--accent-green)] opacity-60 sm:text-[10px]"
              aria-hidden="true"
            >
              {ASCII_LOGO}
            </pre>
            <p className="max-w-xs font-mono text-xs text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {t("description")}
            </p>
            <p className="font-mono text-xs text-[var(--text-dim)]">
              <span className="text-[var(--accent-purple)]">{`//`}</span>{" "}
              {t("domain")}
            </p>
          </div>

          <nav aria-label={tA11y("footerNavAriaLabel")}>
            <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <span className="text-[var(--accent-purple)]">#</span>{" "}
              {t("navigation")}
            </h2>
            <ul className="space-y-2" role="list">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 font-mono text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-green)]"
                  >
                    <span
                      className="text-[var(--text-dim)] transition-colors group-hover:text-[var(--accent-green)]"
                      aria-hidden="true"
                    >
                      &gt;
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <span className="text-[var(--accent-orange)]">#</span>{" "}
              {t("resources")}
            </h2>
            <ul className="space-y-2" role="list">
              {externalLinks.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target={
                        link.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        link.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="group flex items-center gap-2 font-mono text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-green)]"
                    >
                      <span
                        className="text-[var(--text-dim)] transition-colors group-hover:text-[var(--accent-green)]"
                        aria-hidden="true"
                      >
                        &gt;
                      </span>
                      {link.label}
                      {link.href.startsWith("http") ? (
                        <>
                          <svg
                            className="size-3 text-[var(--text-dim)]"
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
                          <span className="sr-only">
                            {tA11y("opensInNewTab")}
                          </span>
                        </>
                      ) : null}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      className="group flex items-center gap-2 font-mono text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-green)]"
                    >
                      <span
                        className="text-[var(--text-dim)] transition-colors group-hover:text-[var(--accent-green)]"
                        aria-hidden="true"
                      >
                        &gt;
                      </span>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--border-dim)] pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="font-mono text-xs text-[var(--text-dim)]">
              <span className="text-[var(--accent-green)]">[</span>
              {currentYear}
              <span className="text-[var(--accent-green)]">]</span> Public API
              <span className="mx-2 text-[var(--text-muted)]">|</span>
              <span className="text-[var(--accent-cyan)]">{t("exitCode")}</span>
            </p>

            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[var(--text-dim)]">
                <span
                  className="status-dot status-online mr-2 inline-block"
                  aria-hidden="true"
                />
                <span className="sr-only">Status: </span>
                {t("allSystemsOperational")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
