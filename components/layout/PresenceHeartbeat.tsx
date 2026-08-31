"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { HEARTBEAT_MS, heartbeatPresence } from "@/lib/presence";
import { createClient } from "@/lib/supabase/client";

export function PresenceHeartbeat() {
  const { user } = useAuth();
  const myId = user?.id;

  useEffect(() => {
    if (!myId) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;

    const beat = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void heartbeatPresence(supabase);
    };

    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [myId]);

  return null;
}
