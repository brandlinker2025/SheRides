"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";

const benefits = [
  { title: "Ride Log & Achievements", icon: "route", features: ["Total kilometres", "Completed rides", "First Highway Ride", "100 / 500 / 1000 km badges"], href: "/rides", action: "Open rides" },
  { title: "Bike Health & Renewal Reminder", icon: "build_circle", features: ["Service reminder", "Engine oil reminder", "Tyre check", "Insurance renewal", "Fitness / document renewal"], href: "/saved", action: "Open saved tools" },
  { title: "Anonymous Safety Alert", icon: "report", features: ["Harassment report", "Unsafe road report", "Unsafe area warning", "Anonymous reporting", "Community safety alert"], href: "/safety", action: "Open Safety Center" },
  { title: "Verified Riding Instructors", icon: "school", features: ["Verified status", "Female-friendly instructors", "Instructor profile", "Rider rating", "Training information"], href: "/explore", action: "Explore riders" },
  { title: "Peer Support Space", icon: "favorite", features: ["Riding anxiety", "Family / social pressure", "Harassment experience", "Confidence support", "Optional anonymous sharing"], href: "/groups", action: "Open groups" },
  { title: "Weather & Ride Alerts", icon: "thunderstorm", features: ["Rain warning", "Storm warning", "Extreme weather", "Flood-risk warning", "Planned ride alert"], href: "/rides", action: "Open planned rides" },
  { title: "Emergency & SOS", icon: "sos", features: ["Accident SOS", "Harassment SOS", "Breakdown assistance", "Admin alert", "Nearby rider alert"], href: "#live-sos", action: "Use live SOS" },
  { title: "Nearby Riders & Help", icon: "near_me", features: ["Verified nearby female riders", "Workshop", "Fuel station", "Hospital", "Nearby help"], href: "#nearby-help", action: "Enable nearby help" },
  { title: "Learn, Mentor & Ride Together", icon: "groups", features: ["Mentor connection", "Beginner progression", "City / highway skills", "Verified group rides", "Ride Together"], href: "/rides", action: "Ride together" },
  { title: "Opportunities & Marketplace", icon: "workspace_premium", features: ["Brand campaigns", "Sponsorship", "Jobs / training", "Content collaboration", "Future trusted marketplace"], href: "/groups", action: "Open community" },
];

const problems = [
  ["accident", "Accident"],
  ["harassment", "Harassment"],
  ["breakdown", "Bike breakdown"],
  ["unsafe_road", "Unsafe road"],
  ["medical", "Medical emergency"],
  ["other", "Other urgent problem"],
] as const;

function getLocation() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported on this device."));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  });
}

export default function RiderBenefitsPage() {
  const [problem, setProblem] = useState("accident");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [nearbyStatus, setNearbyStatus] = useState<string | null>(null);

  const enableNearbyHelp = async () => {
    setNearbyStatus("Getting your location…");
    try {
      const position = await getLocation();
      const supabase = createClient();
      if (!supabase) throw new Error("SheRides connection is unavailable.");
      const { error } = await supabase.rpc("update_my_rider_location", {
        p_latitude: position.coords.latitude,
        p_longitude: position.coords.longitude,
      });
      if (error) throw error;
      setNearbyStatus("Nearby Help is active. Your location is available for nearby emergency matching for 24 hours.");
    } catch (error) {
      setNearbyStatus(error instanceof Error ? error.message : "Could not enable nearby help.");
    }
  };

  const sendSOS = async () => {
    if (sending) return;
    setSending(true);
    setStatus("Getting your current location…");
    try {
      const position = await getLocation();
      setStatus("Sending emergency alert…");
      const supabase = createClient();
      if (!supabase) throw new Error("SheRides connection is unavailable.");
      const { data, error } = await supabase.rpc("submit_emergency_alert", {
        p_problem_type: problem,
        p_note: note.trim() || null,
        p_latitude: position.coords.latitude,
        p_longitude: position.coords.longitude,
      });
      if (error) throw error;
      setStatus(`Alert sent successfully${data ? ` · ID ${String(data).slice(0, 8)}` : ""}. Admins and eligible nearby riders have been notified.`);
      setNote("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send the emergency alert.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
      <section id="live-sos" className="mb-5 rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-5 sm:p-6 shadow-premium">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0"><Icon name="sos" size={28} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-red-600">Live emergency network</p>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Need help now?</h1>
            <p className="mt-1 font-body-sm text-secondary">Choose the problem and press the alert button. SheRides sends your current location alert to Admin and verified nearby riders who recently enabled Nearby Help.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">
          <select value={problem} onChange={(e) => setProblem(e.target.value)} className="rounded-xl border border-surface-border bg-surface-container-lowest px-4 py-3 text-on-surface">
            {problems.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Optional short note: what happened / what help you need" className="rounded-xl border border-surface-border bg-surface-container-lowest px-4 py-3 text-on-surface" />
        </div>
        <button type="button" onClick={() => void sendSOS()} disabled={sending} className="mt-4 w-full sm:w-auto rounded-full bg-red-600 px-7 py-3.5 font-bold text-white shadow-lg disabled:opacity-60">
          {sending ? "Sending alert…" : "SEND EMERGENCY ALERT"}
        </button>
        {status ? <p role="status" className="mt-3 font-body-sm text-on-surface">{status}</p> : null}
      </section>

      <section id="nearby-help" className="mb-6 rounded-2xl border border-accent-magenta/30 bg-accent-magenta/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div><h2 className="font-headline-sm text-headline-sm text-on-surface">Nearby Help Network</h2><p className="mt-1 font-body-sm text-secondary">Enable your current location so SheRides can notify you if another rider within about 25 km sends an emergency alert. Location expires from matching after 24 hours unless refreshed.</p></div>
          <button type="button" onClick={() => void enableNearbyHelp()} className="shrink-0 rounded-full bg-accent-magenta px-5 py-3 font-bold text-white">Enable Nearby Help</button>
        </div>
        {nearbyStatus ? <p role="status" className="mt-3 font-body-sm text-on-surface">{nearbyStatus}</p> : null}
      </section>

      <section className="mb-6">
        <p className="font-label-caps text-label-caps text-accent-magenta mb-2">SheRides</p>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Rider Benefits</h2>
        <p className="mt-2 max-w-3xl font-body-md text-secondary">Safety, support, learning, maintenance and opportunity tools connected to the SheRides ecosystem.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((item, index) => (
          <article key={item.title} className="rounded-xl border border-surface-border bg-surface-container-lowest p-5 shadow-premium">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 shrink-0 rounded-full bg-accent-magenta/12 text-accent-magenta flex items-center justify-center"><Icon name={item.icon} size={24} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2"><span className="mt-1 text-xs font-semibold text-accent-magenta">{String(index + 1).padStart(2, "0")}</span><h3 className="font-headline-sm text-headline-sm text-on-surface">{item.title}</h3></div>
                <div className="mt-3 flex flex-wrap gap-2">{item.features.map((feature) => <span key={feature} className="rounded-full border border-surface-border bg-soft-off-white px-3 py-1 text-xs font-medium text-secondary">{feature}</span>)}</div>
                <Link href={item.href} className="mt-4 inline-flex items-center gap-2 font-label-lg text-accent-magenta">{item.action}<Icon name="arrow_forward" size={18} /></Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
