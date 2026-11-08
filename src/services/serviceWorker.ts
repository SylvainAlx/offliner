/**
 * Registers the service worker in production only. In development, a service
 * worker would serve stale modules from its cache, so any registration left by
 * a previous production preview on the same origin is removed.
 */
export function setupServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  if (!import.meta.env.PROD) {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      )
      .catch(() => undefined);
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      // Registration errors are not fatal: the app still works online.
      console.error("Service worker registration failed:", error);
    });
  });
}
