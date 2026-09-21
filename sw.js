/* DiKonnect service worker.
   HOW TO RELEASE AN UPDATE:
   1. Bump APP_VERSION below.
   2. Set the same version in version.json.
   Open PWAs poll version.json, detect the change, fetch this new sw.js,
   pre-cache the new files and reload themselves automatically. */

const APP_VERSION = "1.0.9";
const CACHE_NAME = "dikonnect-" + APP_VERSION;

/* app shell — cached on install so the PWA works offline */
const SHELL = [
  "index.html",
  "main.html",
  "css/login.css",
  "css/main.css",
  "js/login.js",
  "js/main.js",
  "js/pwa.js",
  "manifest.json",
  "version.json",
  "sources/img/logo.png",
  "sources/img/001.png",
  "sources/img/002.jpg",
  "sources/img/003.jpg",
  "sources/img/004.jpg",
  "sources/img/005.jpg",
  "sources/db_accounts.json",
  "sources/db_dialogues.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith("dikonnect-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* the page tells the waiting worker to take over immediately */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* network-first with cache fallback: always fresh when online,
   still works offline */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  /* version.json must never be answered from cache */
  if (req.url.includes("version.json")) {
    event.respondWith(fetch(req, { cache: "no-store" }).catch(() => caches.match(req)));
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit ||
          (req.mode === "navigate" ? caches.match("index.html") : undefined))
      )
  );
});
