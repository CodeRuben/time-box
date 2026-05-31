"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";
const DEFAULT_THEME: Theme = "light";
const THEME_STORAGE_KEY = "theme";
const THEME_CHANGE_EVENT = "themechange";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  return localStorage.getItem(THEME_STORAGE_KEY) === "dark"
    ? "dark"
    : DEFAULT_THEME;
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function applyTheme(newTheme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  document.documentElement.classList.toggle("dark", newTheme === "dark");
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function isTypeableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"], [role="textbox"]') !== null
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToThemeChanges,
    getStoredTheme,
    () => DEFAULT_THEME
  );

  const updateTheme = useCallback((newTheme: Theme) => {
    applyTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    updateTheme(newTheme);
  }, [theme, updateTheme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.toLowerCase() !== "d" ||
        isTypeableElement(event.target)
      ) {
        return;
      }

      toggleTheme();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  const contextValue = useMemo(
    () => ({ theme, setTheme: updateTheme, toggleTheme }),
    [theme, updateTheme, toggleTheme]
  );

  // The script in layout.tsx handles the initial theme to prevent flash
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = use(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
