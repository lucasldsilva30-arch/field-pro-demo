"use client";

import { useCallback, useEffect, useState } from "react";

export type ErpTheme = {
  accent: string;
  fontScale: number;
  mode: "dark" | "light";
};

const STORAGE_KEY = "fieldpro-theme-v1";

export const defaultErpTheme: ErpTheme = {
  accent: "#f5b900",
  fontScale: 1,
  mode: "dark",
};

export function useErpTheme() {
  const [theme, setThemeState] = useState<ErpTheme>(() => {
    if (typeof window === "undefined") {
      return defaultErpTheme;
    }

    return readStoredTheme();
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = () => {
      const nextTheme = readStoredTheme();
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    window.addEventListener("storage", syncTheme);
    window.addEventListener("fieldpro-theme-change", syncTheme);

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("fieldpro-theme-change", syncTheme);
    };
  }, []);

  const setTheme = useCallback((nextTheme: ErpTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTheme));
    window.dispatchEvent(new CustomEvent("fieldpro-theme-change"));
  }, []);

  const resetTheme = useCallback(() => {
    setTheme(defaultErpTheme);
  }, [setTheme]);

  return { theme, setTheme, resetTheme };
}

function readStoredTheme(): ErpTheme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultErpTheme, ...JSON.parse(stored) } : defaultErpTheme;
  } catch {
    return defaultErpTheme;
  }
}

function applyTheme(theme: ErpTheme) {
  document.documentElement.dataset.theme = theme.mode;
  document.documentElement.classList.toggle("dark", theme.mode === "dark");
  document.documentElement.style.setProperty("--erp-accent", theme.accent);
  document.documentElement.style.setProperty("--erp-font-scale", String(theme.fontScale));
}
