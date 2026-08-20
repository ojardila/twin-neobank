// Theme + accent personalization, persisted to localStorage and applied as
// data-attributes on <html> (see index.css for the palettes).
import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
export type Accent = "blue" | "violet" | "teal" | "green";

export const ACCENTS: { key: Accent; label: string; swatch: string }[] = [
  { key: "blue", label: "Blue", swatch: "#5b8cff" },
  { key: "violet", label: "Violet", swatch: "#a855f7" },
  { key: "teal", label: "Teal", swatch: "#14b8a6" },
  { key: "green", label: "Green", swatch: "#34d399" },
];

const THEME_KEY = "twin.theme";
const ACCENT_KEY = "twin.accent";

function read<T>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => read<Theme>(THEME_KEY, "dark"));
  const [accent, setAccent] = useState<Accent>(() => read<Accent>(ACCENT_KEY, "blue"));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* ignore */
    }
  }, [accent]);

  return {
    theme,
    accent,
    setAccent,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
}
