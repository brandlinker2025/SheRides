const CACHE = "sherides-static-v3";
const PUBLIC_ASSETS = new Set(["/icon.svg", "/sherides-logo.svg"]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([...PUBLIC_ASSETS])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isSafeStaticAsset = url.pathname.startsWith("/_next/static/") || PUBLIC_ASSETS.has(url.pathname);
  if (!isSafeStaticAsset) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
