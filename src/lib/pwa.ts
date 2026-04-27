/**
 * Register the service worker in production only, and never in iframe/preview.
 * Lovable's editor preview embeds the app in an iframe — registering a SW there
 * caches stale builds and breaks live updates.
 */
export const registerPWA = () => {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const inIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("lovableproject.com") ||
    host.includes("lovable.app") === false && host.includes("lovable.dev") ||
    host.includes("id-preview--") ||
    host === "localhost" ||
    host === "127.0.0.1";

  // In preview/iframe, proactively unregister any prior SW so dev updates flow.
  if (inIframe || isPreviewHost) {
    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore registration errors */
    });
  });
};