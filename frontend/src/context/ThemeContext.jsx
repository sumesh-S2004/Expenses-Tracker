import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "wealthflow_theme";

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  // "light" | "dark" | "system"
  const [theme, setThemeState] = useState(() => localStorage.getItem(KEY) || "dark");
  const [resolved, setResolved] = useState(() => (theme === "system" ? systemTheme() : theme));

  useEffect(() => {
    const apply = () => {
      const next = theme === "system" ? systemTheme() : theme;
      setResolved(next);
      document.documentElement.setAttribute("data-theme", next);
    };
    apply();

    // "System default" follows the OS live
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  const setTheme = (t) => {
    localStorage.setItem(KEY, t);
    setThemeState(t);
  };

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
