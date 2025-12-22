"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "api-nav-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("theme-light", theme === "light");
  root.classList.toggle("theme-dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_KEY)) as Theme | null;
    const initial = stored === "light" ? "light" : "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded border border-[var(--border-dim)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-green)] hover:text-[var(--accent-green)]"
      aria-label="Toggle color theme"
      type="button"
    >
      <span className="text-[var(--accent-cyan)]">theme</span>
      <span className="text-[var(--text-muted)]">&gt;</span>
      <span className="uppercase">{theme}</span>
    </button>
  );
}
