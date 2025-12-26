"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

type Theme = "dark" | "light";
const STORAGE_KEY = "api-nav-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("theme-light", theme === "light");
  root.classList.toggle("theme-dark", theme === "dark");
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function ThemeToggle() {
  const t = useTranslations("themeToggle");
  // Use useSyncExternalStore to properly sync with localStorage
  const theme = useSyncExternalStore(
    subscribeToStorage,
    getStoredTheme,
    () => "dark" as Theme, // Server snapshot
  );
  // Apply theme class on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
      // Dispatch storage event to trigger useSyncExternalStore update
      window.dispatchEvent(new Event("storage"));
    }
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded border border-[var(--border-dim)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-green)] hover:text-[var(--accent-green)]"
      aria-label={t("toggleTheme")}
      type="button"
    >
      <span className="text-[var(--accent-cyan)]">theme</span>
      <span className="text-[var(--text-muted)]">&gt;</span>
      <span className="uppercase">{theme}</span>
    </button>
  );
}
