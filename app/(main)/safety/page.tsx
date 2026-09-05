"use client";

import { useState } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Icon } from "@/components/ui/Icon";
import { locationErrorMessage, requestRiderLocation } from "@/lib/geolocation";
import { createClient } from "@/lib/supabase/client";

export default function SafetyPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
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
      ping(
        `SOS sent${data ? ` · ID ${String(data).slice(0, 8)}` : ""}${
          latitude != null ? " with your location." : "."
        } Admins were notified.${locationNote}`
      );
    } catch (error) {
      ping(error instanceof Error ? error.message : "Could not send the emergency alert. Please try again now.");
    } finally {
      setSending(false);
    }
  };

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
        <button
          type="button"
          onClick={() => void sendSOS()}
          disabled={sending}
          className="col-span-1 md:col-span-2 lg:col-span-1 bg-accent-magenta text-on-primary rounded-xl p-8 flex flex-col items-center justify-center gap-4 shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-sos-pulse disabled:opacity-70"
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          <Icon name="emergency" filled className="text-[64px] drop-shadow-md" />
          <div className="text-center">
            <h3 className="font-headline-md text-headline-md font-bold mb-1">{sending ? "Sending SOS…" : "SOS Alert"}</h3>
            <p className="font-body-sm opacity-90">
              Tap to request Location Allow, then send a live distress signal to Admins and nearby responders.
            </p>
          </div>
        </button>

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
