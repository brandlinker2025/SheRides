"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    async function removeLegacyOfflineState() {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("sherides-")).map((key) => caches.delete(key)));
      }
    }

    void removeLegacyOfflineState().catch(() => undefined);
  }, []);
  return null;
}
