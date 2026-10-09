"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    async function setup() {
      // Clear legacy offline caches, but retain an active service worker
      // so supported browsers can install the PWA.
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("sherides-")).map((key) => caches.delete(key)));
      }
      if (cancelled) return;
      await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    }
    void setup().catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  return null;
}
