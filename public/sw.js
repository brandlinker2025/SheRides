// Network-only SheRides PWA service worker.
// No fetch interception: navigation and API calls always use the network.
// Old SheRides offline caches are removed during activation.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("sherides-")).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
