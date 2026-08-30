// Retirement worker: older SheRides releases cached navigation requests and
// could turn a temporary network failure into a persistent browser ERR_FAILED.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("sherides-")).map((key) => caches.delete(key)))
      ),
      self.registration.unregister(),
    ]).then(() => self.clients.claim())
  );
});
