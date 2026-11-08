/* Offliner — Service Worker
 *
 * Les deux valeurs ci-dessous sont remplacées au build par le plugin
 * `offlinerServiceWorker` de vite.config.ts :
 *  - BUILD_VERSION : empreinte du build, donc un cache neuf à chaque déploiement ;
 *  - PRECACHE_ASSETS : fichiers générés (JS/CSS hashés), pré-cachés à l'installation
 *    pour que l'application fonctionne hors ligne dès la première visite.
 *
 * Stratégie :
 *  - INSTALL : pré-cache le shell et les fichiers du build ;
 *  - ACTIVATE : supprime les caches Offliner des versions précédentes ;
 *  - FETCH :
 *      • navigations : réseau d'abord (avec délai maximal), repli sur le shell en cache ;
 *      • autres GET de même origine : cache d'abord, repli réseau.
 */

const BUILD_VERSION = "__OFFLINER_BUILD_VERSION__";
const PRECACHE_ASSETS = /*__OFFLINER_PRECACHE__*/ [];

const CACHE_PREFIX = "offliner-";
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_VERSION}`;
const SHELL_URL = "./index.html";
const APP_SHELL = [
  "./",
  SHELL_URL,
  "./manifest.webmanifest",
  "./icons/logo.svg",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
];
const NAVIGATION_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([...new Set([...APP_SHELL, ...PRECACHE_ASSETS])]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    // Only a valid page may become the offline shell (never a 404 or a 500).
    if (response.ok && response.type === "basic") {
      await cache.put(SHELL_URL, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(SHELL_URL)) ?? Response.error();
  }
}

async function handleAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});
