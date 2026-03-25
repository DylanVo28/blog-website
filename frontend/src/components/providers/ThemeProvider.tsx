"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useUiStore } from "@/stores/uiStore";
import type { ThemeMode } from "@/stores/uiStore";

interface ThemeProviderProps {
  children: ReactNode;
}

function resolveTheme(theme: ThemeMode, prefersDark: boolean) {
  if (theme === "system") {
    return prefersDark ? "dark" : "light";
  }

  return theme;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function syncTheme() {
      const resolvedTheme = resolveTheme(theme, mediaQuery.matches);
      const root = document.documentElement;

      root.classList.toggle("dark", resolvedTheme === "dark");
      root.dataset.theme = resolvedTheme;
      root.style.colorScheme = resolvedTheme;
    }

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, [theme]);

  return children;
}
