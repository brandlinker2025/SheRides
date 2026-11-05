"use client";

import { useEffect, useRef, useState } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Icon } from "@/components/ui/Icon";
import { locationErrorMessage, requestRiderLocation } from "@/lib/geolocation";
import { createClient } from "@/lib/supabase/client";

export default function SafetyPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // SOS switch: flipping it ON starts a short countdown so an accidental flip can be undone.
  const [armed, setArmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, []);
  const ping = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  const sendSOS = async () => {
    if (sending) return;
    setSending(true);
    ping("Requesting Location Allow…");
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      let locationNote = "";
      try {
        const position = await requestRiderLocation();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (locationError) {
        locationNote = ` ${locationErrorMessage(locationError)}`;
      }
      const supabase = createClient();
      if (!supabase) throw new Error("SheRides connection is unavailable.");
      const { data, error } = await supabase.rpc("submit_emergency_alert", {
        p_problem_type: "other",
        p_note: "SOS from Safety Center",
        p_latitude: latitude,
        p_longitude: longitude,
      });
      if (error) throw error;
      setSentAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      ping(
        `SOS sent${data ? ` · ID ${String(data).slice(0, 8)}` : ""}${
          latitude != null ? " with your location." : "."
        } Admins were notified.${locationNote}`
      );
    } catch (error) {
      setArmed(false);
      ping(error instanceof Error ? error.message : "Could not send the emergency alert. Please try again now.");
    } finally {
      setSending(false);
    }
  };

  function stopCountdown() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setCountdown(null);
  }

  function onSwitch(on: boolean) {
    if (sending) return;
    if (on) {
      setArmed(true);
      setSentAt(null);
      let remaining = 3;
      setCountdown(remaining);
      if (navigator.vibrate) navigator.vibrate(200);
      timerRef.current = window.setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          setCountdown(remaining);
          return;
        }
        stopCountdown();
        void sendSOS();
      }, 1000);
      return;
    }
    const cancelled = countdown !== null;
    stopCountdown();
    setArmed(false);
    setSentAt(null);
    if (cancelled) ping("SOS cancelled. Nothing was sent.");
  }

  const sosStatus = sending
    ? "Sending SOS with your location…"
    : countdown !== null
      ? `Sending in ${countdown}… flip the switch down to cancel`
      : sentAt
        ? `SOS sent at ${sentAt}. Admins were notified.`
        : "Flip the switch up to send an SOS to SheRides admins";

  const tiles = [
    { icon: "share_location", title: "Share My Ride", body: "Broadcast your live route and estimated arrival time to trusted friends or family." },
    { icon: "contacts", title: "Emergency Contacts", body: "Manage the priority list of people to notify in case of an incident during your ride." },
    { icon: "car_repair", title: "Roadside Help", body: "Request immediate mechanical assistance or a tow from verified partners nearby." },
    { icon: "flag", title: "Report User", body: "Anonymously report inappropriate behavior to maintain our premium community standards.", danger: true },
    { icon: "block", title: "Block User", body: "Prevent specific members from viewing your profile, routes, or contacting you.", danger: true },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-container-margin-mobile lg:px-container-margin-desktop py-12">
      <div className="mb-12">
        <BackLink href="/home" label="Home" className="mb-4" />
        <h1 className="font-headline-xl text-headline-xl text-on-background mb-2">Safety Center</h1>
        <p className="font-body-lg text-secondary max-w-2xl">
          Your well-being is our priority. Access immediate assistance, manage your ride visibility, and control your community experience with these essential tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className={`col-span-1 md:col-span-2 lg:col-span-3 rounded-[20px] p-6 sm:p-8 flex items-center gap-6 sm:gap-10 bg-gradient-to-br from-[#2a0610] via-[#3d0a1a] to-[#14040a] text-white shadow-xl border border-[#ff1818]/30 ${
            armed ? "animate-sos-pulse" : ""
          }`}
        >
          <label className="sos-switch" aria-label="SOS switch">
            <input
              type="checkbox"
              checked={armed}
              disabled={sending}
              onChange={(event) => onSwitch(event.target.checked)}
            />
            <span className="sos-button">
              <span className="sos-light" />
              <span className="sos-dots" />
              <span className="sos-characters" />
              <span className="sos-shine" />
              <span className="sos-shadow" />
            </span>
          </label>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="emergency" filled className="text-[#ff4d4d]" />
              <h3 className="font-headline-md text-headline-md font-bold">SOS Alert</h3>
            </div>
            <p className="font-body-md text-white/85 max-w-md" role="status" aria-live="assertive">
              {sosStatus}
            </p>
            {countdown !== null ? (
              <p className="mt-3 font-display-lg text-[44px] leading-none font-bold text-[#ff4d4d]">{countdown}</p>
            ) : (
              <p className="mt-3 font-body-sm text-white/55">Your live location is shared if you allow it.</p>
            )}
          </div>
        </div>

        {tiles.map((tile) => (
          <button
            key={tile.title}
            type="button"
            onClick={() => ping(`${tile.title} opened.`)}
            className="bg-surface-container-lowest text-on-background rounded-xl p-6 flex flex-col items-start gap-4 shadow-premium border border-surface-border hover:-translate-y-1 hover:shadow-premium-hover transition-all duration-300 group text-left active:scale-[0.99]"
          >
            <div
              className={`w-12 h-12 rounded-full bg-soft-off-white flex items-center justify-center ${
                tile.danger
                  ? "text-secondary group-hover:text-error"
                  : "text-accent-magenta group-hover:bg-accent-magenta group-hover:text-on-primary"
              } transition-colors`}
            >
              <Icon name={tile.icon} filled />
            </div>
            <div>
              <h3 className="font-label-lg text-label-lg mb-1">{tile.title}</h3>
              <p className="font-body-sm text-secondary">{tile.body}</p>
            </div>
          </button>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 bg-deep-charcoal text-white font-label-lg px-5 py-3 rounded-full shadow-premium z-[60]">
          {toast}
        </div>
      )}
    </div>
  );
}
