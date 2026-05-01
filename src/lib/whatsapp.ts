/**
 * WhatsApp link helpers + robust open-with-fallback.
 *
 * Why this exists:
 *   - `window.open(url, "_blank")` is silently blocked by browsers when
 *     called after `await` because the user-gesture trust is lost.
 *   - Mobile Safari, Chrome iOS, and most popup blockers will return `null`
 *     from `window.open` in that case.
 *   - Arabic text + emoji must be percent-encoded with `encodeURIComponent`,
 *     which `URL`/`URLSearchParams` does correctly.
 *
 * Strategy:
 *   1) Normalize the phone (digits only, no +/spaces).
 *   2) Build a `wa.me` URL — the most reliable cross-platform format.
 *   3) `openWhatsApp()` first redirects a pre-opened window when available,
 *      then tries mobile location navigation, then a final direct popup.
 *   4) If everything fails, return `{ ok: false, url, text }` so the UI can
 *      show a fallback dialog with copy-to-clipboard and a manual link.
 */

export type WaTarget = {
  /** International phone, digits only. e.g. "201080068689". */
  phone: string;
  /** Plain text body — will be URL-encoded. */
  text: string;
};

/** Normalize a phone number: keep digits only, drop leading +. */
export const normalizeWaPhone = (raw: string): string => {
  if (!raw) return "";
  return String(raw).replace(/\D+/g, "");
};

/** Build a wa.me URL. Encodes text safely (Arabic + emoji ok). */
export const buildWaUrl = ({ phone, text }: WaTarget): string => {
  const p = normalizeWaPhone(phone);
  const encoded = encodeURIComponent(text ?? "");
  // wa.me is the canonical short link; falls back to api.whatsapp.com on
  // some platforms automatically. Both desktop and mobile honor it.
  return p
    ? `https://wa.me/${p}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
};

/**
 * Pre-open a placeholder window inside a user gesture.
 * Call this at the *start* of a click handler, BEFORE any await.
 * Later, redirect the returned handle with `redirectPreOpenedWindow()`.
 *
 * Returns `null` if the popup was blocked.
 */
export const preOpenWindow = (source = "unknown"): Window | null => {
  try {
    // Do not pass `noopener` here: several browsers intentionally return
    // `null` for noopener windows, which makes later gesture-safe redirects
    // impossible. We sever the opener manually after the handle is captured.
    const w = window.open("about:blank", "_blank");
    if (!w) {
      console.warn("[wa] pre-open blocked", { source });
      return null;
    }
    try {
      w.opener = null;
    } catch {
      /* noop */
    }
    console.info("[wa] pre-opened blank window", { source });
    return w;
  } catch (e) {
    console.warn("[wa] pre-open threw", { source, error: e });
    return null;
  }
};

/** Redirect a pre-opened window to the final URL. */
export const redirectPreOpenedWindow = (
  win: Window | null,
  url: string,
): boolean => {
  if (!win || win.closed) return false;
  try {
    win.location.href = url;
    return true;
  } catch {
    return false;
  }
};

export type OpenResult =
  | { ok: true; method: "preopened" | "window-open" | "location" }
  | { ok: false; url: string; text: string; reason: string };

/**
 * Robust WhatsApp opener.
 *   - If `preOpened` is provided and still alive, redirect it (best path).
 *   - Otherwise try `window.open` — works only if still in a gesture.
 *   - On mobile, fall back to `location.href` (replaces tab with WhatsApp).
 *   - Returns a structured result so callers can show a fallback UI.
 */
export const openWhatsApp = (
  target: WaTarget,
  opts?: {
    preOpened?: Window | null;
    preferLocation?: boolean;
    source?: string;
  },
): OpenResult => {
  const url = buildWaUrl(target);
  const text = target.text ?? "";
  const source = opts?.source ?? "unknown";

  // 1) Redirect pre-opened window — survives awaits.
  if (opts?.preOpened && !opts.preOpened.closed) {
    console.log("[wa] attempting preopened redirect", { source, url });
    if (redirectPreOpenedWindow(opts.preOpened, url)) {
      console.info("[wa] opened via preopened redirect", { source });
      return { ok: true, method: "preopened" };
    }
    console.warn("[wa] preopened redirect failed", { source });
  }

  // 2) Direct location replace (mobile-friendly, no popup needed).
  if (opts?.preferLocation) {
    try {
      console.log("[wa] attempting location.href", { source, url });
      window.location.href = url;
      console.info("[wa] opened via location.href", { source });
      return { ok: true, method: "location" };
    } catch (e) {
      console.warn("[wa] location.href failed", { source, error: e });
    }
  }

  // 3) window.open as a last resort; it may be blocked, but trying is safer
  // than silently failing when a pre-opened tab was closed or lost.
  try {
    console.log("[wa] attempting direct window.open", { source, url });
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) {
      console.info("[wa] opened via direct window.open", { source });
      return { ok: true, method: "window-open" };
    }
    console.warn("[wa] direct window.open blocked", { source });
  } catch (e) {
    console.warn("[wa] window.open threw", { source, error: e });
  }

  return { ok: false, url, text, reason: "popup_blocked" };
};

/** Detect mobile (iOS/Android) for routing decisions. */
export const isMobileWaContext = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/** Copy arbitrary text to clipboard with a graceful fallback. */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn("[wa] clipboard api failed, falling back", e);
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};
