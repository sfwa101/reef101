import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ColorTheme =
  | "sage"
  | "ocean"
  | "amber"
  | "midnight"
  | "blush"
  | "lavender"
  | "mint"
  | "peach";
export type Mode = "light" | "dark" | "system";

type ThemeCtx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  resolvedMode: "light" | "dark";
  colorTheme: ColorTheme;
  setColorTheme: (c: ColorTheme) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // SSR-safe defaults; hydrate from localStorage on mount
  const [mode, setModeState] = useState<Mode>("light");
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("sage");
  const [systemMode, setSystemMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedMode = (localStorage.getItem("reef-mode") as Mode | null) || "light";
    const storedColor = (localStorage.getItem("reef-color") as ColorTheme | null) || "sage";
    setModeState(storedMode);
    setColorThemeState(storedColor);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemMode(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) => setSystemMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedMode = mode === "system" ? systemMode : mode;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedMode === "dark");
    if (colorTheme === "sage") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", colorTheme);
  }, [resolvedMode, colorTheme]);

  const setMode = (m: Mode) => {
    setModeState(m);
    localStorage.setItem("reef-mode", m);
  };
  const setColorTheme = (c: ColorTheme) => {
    setColorThemeState(c);
    localStorage.setItem("reef-color", c);
  };

  return (
    <Ctx.Provider value={{ mode, setMode, resolvedMode, colorTheme, setColorTheme }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTheme = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
};