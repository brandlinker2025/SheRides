"use client";

/**
 * SheRides ride — rider (driver) GPS sender.
 *
 * While `enabled` is true, watches the phone GPS and sends the position to the
 * database every ~4 seconds via `go_set_online`. The passenger's screen updates
 * live through Supabase Realtime.
 *
 * Usage:
 *   const gps = useDriverLocationSender(isRider && rideIsActive);
 *   gps.status → "idle" | "requesting" | "tracking" | "denied" | "unsupported" | "error"
 *
 * Note: browsers pause GPS when the screen locks, so this keeps the screen
 * awake while tracking (Wake Lock API, where supported).
 */
import { useEffect, useRef, useState } from "react";
import { locationErrorMessage } from "@/lib/geolocation";
import { sendRiderLocation, toGpsFix } from "@/services/goLocationService";

const SEND_EVERY_MS = 4_000;
const MAX_ACCURACY_M = 150; // ignore very rough GPS fixes

export type GpsStatus = "idle" | "requesting" | "tracking" | "denied" | "unsupported" | "error";

export type DriverLocationState = {
  status: GpsStatus;
  lastSentAt: Date | null;
  error: string | null;
};

export function useDriverLocationSender(enabled: boolean): DriverLocationState {
  const [status, setStatus] = useState<GpsStatus>("idle");
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastSent = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setError("Location is not supported on this device.");
      return;
    }

    let active = true;
    let wakeLock: WakeLockSentinel | null = null;
    setStatus("requesting");

    const keepScreenOn = async () => {
      try {
        if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
      } catch {
        /* optional feature */
      }
    };
    void keepScreenOn();
    const onVisible = () => {
      if (document.visibilityState === "visible") void keepScreenOn();
    };
    document.addEventListener("visibilitychange", onVisible);

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (!active) return;
        setStatus("tracking");

        const fix = toGpsFix(pos);
        if (fix.accuracyM != null && fix.accuracyM > MAX_ACCURACY_M) return;

        const now = Date.now();
        if (inFlight.current || now - lastSent.current < SEND_EVERY_MS) return;
        lastSent.current = now;
        inFlight.current = true;

        try {
          await sendRiderLocation(fix);
          if (active) {
            setLastSentAt(new Date());
            setError(null);
          }
        } catch (e) {
          if (active) setError(e instanceof Error ? e.message : "Could not send location.");
        } finally {
          inFlight.current = false;
        }
      },
      (err) => {
        if (!active) return;
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
        setError(locationErrorMessage(err));
      },
      { enableHighAccuracy: true, maximumAge: 3_000, timeout: 20_000 },
    );

    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
      document.removeEventListener("visibilitychange", onVisible);
      void wakeLock?.release().catch(() => {});
    };
  }, [enabled]);

  return { status, lastSentAt, error };
}
