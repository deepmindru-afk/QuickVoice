"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const storageKey = "quickvoice-docs-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(storageKey) === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed right-4 top-4 z-[100] inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--qv-border)] bg-[var(--qv-card)] px-3 text-sm font-semibold text-[var(--qv-ink)] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-[var(--qv-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--qv-blue)]/35"
      onClick={toggleTheme}
    >
      {isDark ? <Sun aria-hidden="true" className="size-4 text-[var(--qv-blue)]" /> : <Moon aria-hidden="true" className="size-4 text-[var(--qv-blue)]" />}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
