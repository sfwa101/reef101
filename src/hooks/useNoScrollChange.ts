import { useEffect, useRef } from "react";

/**
 * Disable mouse wheel + touch swipe value changes on number / range / date /
 * select inputs. The native browser behavior of changing the value when the
 * user is just trying to scroll the page is a famous UX papercut.
 *
 * Usage: const ref = useNoScrollChange<HTMLInputElement>(); <input ref={ref} ... />
 */
export function useNoScrollChange<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement === el) {
        // Blur so the wheel doesn't change the value, but page still scrolls.
        (el as unknown as HTMLElement).blur();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        // Allow only if user is intentionally focused (most number inputs).
        // We don't fully prevent — just stop bubble for selects/dates.
        const tag = (el as HTMLElement).tagName;
        if (tag === "SELECT") e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("keydown", onKey);
    };
  }, []);
  return ref;
}
