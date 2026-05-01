import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTheme, type Mode } from "@/context/ThemeContext";

/**
 * UIContext — global UI orchestration layer.
 *
 * Composition over inheritance: this context DELEGATES theme handling to
 * ThemeContext (single source of truth for light/dark/system) and adds
 * the orthogonal `viewMode` axis for accessibility:
 *   - 'standard'    → default, dense, full-feature UI
 *   - 'simplified'  → elderly / accessibility mode: larger base font,
 *                     stronger contrast, hidden non-essential decoration.
 *
 * The simplified mode is exposed to CSS via `data-view-mode` on <html>,
 * so any component can opt in via a single semantic selector without
 * branching JSX. (Server-Driven UI / "stem cell" style.)
 */

export type ViewMode = "standard" | "simplified";

type UICtx = {
  // Theme — delegated to ThemeContext.
  theme: Mode;
  setTheme: (m: Mode) => void;
  resolvedTheme: "light" | "dark";

  // Accessibility view mode.
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  toggleSimplified: () => void;
};

const Ctx = createContext<UICtx | null>(null);

const STORAGE_KEY = "reef-view-mode";

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const { mode, setMode, resolvedMode } = useTheme();
  const [viewMode, setViewModeState] = useState<ViewMode>("standard");

  // Hydrate from localStorage on mount (SSR-safe).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (stored === "simplified" || stored === "standard") {
      setViewModeState(stored);
    } else {
      localStorage.setItem(STORAGE_KEY, "standard");
    }
  }, []);

  // Reflect viewMode on <html data-view-mode="..."> for CSS targeting.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-view-mode", viewMode);
  }, [viewMode]);

  const setViewMode = (v: ViewMode) => {
    setViewModeState(v);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, v);
  };

  const toggleSimplified = () =>
    setViewMode(viewMode === "simplified" ? "standard" : "simplified");

  return (
    <Ctx.Provider
      value={{
        theme: mode,
        setTheme: setMode,
        resolvedTheme: resolvedMode,
        viewMode,
        setViewMode,
        toggleSimplified,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useUI = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUI must be used within UIProvider");
  return v;
};
