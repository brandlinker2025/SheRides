"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { isLocationPermissionDenied, locationErrorMessage, requestRiderLocation } from "@/lib/geolocation";
import { createClient } from "@/lib/supabase/client";

const benefits = [
  { title: "Ride Log & Achievements", icon: "route", features: ["Total kilometres", "Completed rides", "First Highway Ride", "100 / 500 / 1000 km badges"], href: "/rides", action: "Open rides" },
  { title: "Bike Health & Renewal Reminder", icon: "build_circle", features: ["Service reminder", "Engine oil reminder", "Tyre check", "Insurance renewal", "Fitness / document renewal"], href: "/saved", action: "Open saved tools" },
  { title: "Anonymous Safety Alert", icon: "report", features: ["Harassment report", "Unsafe road report", "Unsafe area warning", "Anonymous reporting", "Community safety alert"], href: "/safety", action: "Open Safety Center" },
  { title: "Verified Riding Instructors", icon: "school", features: ["Verified status", "Female-friendly instructors", "Instructor profile", "Rider rating", "Training information"], href: "/explore", action: "Explore riders" },
  { title: "Peer Support Space", icon: "favorite", features: ["Riding anxiety", "Family / social pressure", "Harassment experience", "Confidence support", "Optional anonymous sharing"], href: "/groups", action: "Open groups" },
  { title: "Weather & Ride Alerts", icon: "thunderstorm", features: ["Rain warning", "Storm warning", "Extreme weather", "Flood-risk warning", "Planned ride alert"], href: "/rides", action: "Open planned rides" },
  { title: "Emergency & SOS", icon: "sos", features: ["Accident SOS", "Harassment SOS", "Breakdown assistance", "Admin alert", "Nearby rider alert"], href: "#live-sos", action: "Use live SOS" },
  { title: "Nearby Riders & Help", icon: "near_me", features: ["Verified nearby female riders", "Workshop", "Fuel station", "Hospital", "Nearby help"], href: "#live-sos", action: "Use nearby help" },
  { title: "Learn, Mentor & Ride Together", icon: "groups", features: ["Mentor connection", "Beginner progression", "City / highway skills", "Verified group rides", "Ride Together"], href: "/rides", action: "Ride together" },
  { title: "Opportunities & Marketplace", icon: "workspace_premium", features: ["Brand campaigns", "Sponsorship", "Jobs / training", "Content collaboration", "Future trusted marketplace"], href: "/groups", action: "Open community" },
];

const problems = [
  ["accident", "Accident", "warning"],
  ["harassment", "Harassment", "pan_tool"],
  ["breakdown", "Breakdown", "build"],
  ["unsafe_road", "Unsafe Road", "warning"],
  ["medical", "Medical", "health_and_safety"],
  ["other", "Other", "more_horiz"],
] as const;

function locationHelpText() {
  if (typeof navigator === "undefined") return "Allow Location for SheRides in your browser settings, then try again.";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone/iPad: Settings → Privacy & Security → Location Services → Safari Websites → While Using. Then in Safari open SheRides, tap aA → Website Settings → Location → Allow.";
  if (/Android/i.test(ua)) return "Android: tap the site controls/lock icon beside the address → Permissions → Location → Allow. Also make sure phone Location/GPS is ON.";
  if (/Edg\//i.test(ua)) return "Microsoft Edge: click the lock/site controls beside the address → Permissions for this site → Location → Allow, then reload SheRides.";
  if (/Chrome\//i.test(ua)) return "Chrome: click the site controls/lock icon beside the address → Site settings → Location → Allow, then reload SheRides.";
  if (/Safari\//i.test(ua)) return "Safari: Safari → Settings → Websites → Location → sherides.online → Allow, then reload SheRides.";
  return "Open your browser's Site permissions for sherides.online, set Location to Allow, make sure device Location/GPS is ON, then try again.";
}

export default function RiderBenefitsPage() {
  const [problem, setProblem] = useState("accident");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [locationText, setLocationText] = useState("Location will be requested when you send the SOS.");
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [locationDenials, setLocationDenials] = useState(0);
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const [nearbyBusy, setNearbyBusy] = useState(false);

  const noteLocationFailure = (error: unknown) => {
    const denied = isLocationPermissionDenied(error);
    setLocationBlocked(denied);
    if (!denied) return false;
    const next = locationDenials + 1;
    setLocationDenials(next);
    setShowLocationHelp(next >= 2);
    return true;
  };

  const requestAndSaveLocation = async () => {
    setLocationText("Requesting location permission…");
    setLocationBlocked(false);
    const position = await requestRiderLocation();
    const supabase = createClient();
    if (!supabase) throw new Error("SheRides connection is unavailable.");
    const { error } = await supabase.rpc("update_my_rider_location", { p_latitude: position.coords.latitude, p_longitude: position.coords.longitude });
    if (error) throw error;
    setNearbyEnabled(true);
    setLocationDenials(0);
    setShowLocationHelp(false);
    setLocationText("Location enabled. Nearby Help is active for 24 hours; your exact location is used only for emergency matching.");
    return position;
  };

  const enableNearbyHelp = async () => {
    if (nearbyBusy) return;
    setNearbyBusy(true);
    try {
      await requestAndSaveLocation();
    } catch (error) {
      const denied = noteLocationFailure(error);
      setLocationText(error instanceof Error && !denied ? error.message : locationErrorMessage(error));
    } finally {
      setNearbyBusy(false);
    }
  };

  const sendSOS = async () => {
    if (sending) return;
    setSending(true);
    setStatus("Preparing emergency alert…");
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        setLocationText("Requesting Location Allow…");
        const position = await requestRiderLocation();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        setLocationBlocked(false);
        setLocationDenials(0);
        setShowLocationHelp(false);
        setLocationText("Live location ready. Admin and eligible nearby responders can receive it securely.");
      } catch (locationError) {
        noteLocationFailure(locationError);
        setLocationText(`${locationErrorMessage(locationError)} Admin will still receive the SOS.`);
      }
      const supabase = createClient();
      if (!supabase) throw new Error("SheRides connection is unavailable.");
      const { data, error } = await supabase.rpc("submit_emergency_alert", { p_problem_type: problem, p_note: note.trim() || null, p_latitude: latitude, p_longitude: longitude });
      if (error) throw error;
      setStatus(`SOS sent successfully${data ? ` · ID ${String(data).slice(0, 8)}` : ""}. All Admins were notified. Verified riders within 25 km are notified when location is available.`);
      setNote("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send the emergency alert. Please try again now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
      <section id="live-sos" className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 mb-7">
        <div className="rounded-2xl border border-red-500/35 bg-black/15 p-5 sm:p-6 shadow-premium">
          <div className="flex items-start gap-4"><div className="h-16 w-16 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg animate-sos-pulse"><Icon name="sos" size={34} /></div><div className="min-w-0"><h1 className="font-headline-lg text-headline-lg text-on-surface">Send Emergency Alert (SOS)</h1><p className="mt-1 font-body-sm text-secondary max-w-3xl">Choose the problem, add a short note if needed and press the alert button. Your browser will ask for Location Allow. All Admins are notified immediately. Verified riders within 25 km are alerted when location is available.</p></div></div>
          <div className="mt-6"><p className="mb-3 font-label-lg text-on-surface">1. What&apos;s the problem?</p><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">{problems.map(([value,label,icon]) => { const active=problem===value; return <button key={value} type="button" onClick={()=>setProblem(value)} className={`rounded-xl border px-3 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${active?"border-accent-magenta bg-accent-magenta/12 text-on-surface":"border-surface-border bg-surface-container-lowest/60 text-secondary hover:border-accent-magenta/50"}`}><Icon name={icon} size={20}/>{label}</button>; })}</div></div>
          <div className="mt-5"><label htmlFor="sos-note" className="mb-2 block font-label-lg text-on-surface">2. Short note (optional)</label><textarea id="sos-note" value={note} onChange={(e)=>setNote(e.target.value)} maxLength={200} rows={3} placeholder="Describe what happened / what help you need…" className="w-full resize-none rounded-xl border border-surface-border bg-surface-container-lowest/70 px-4 py-3 text-on-surface outline-none focus:border-accent-magenta"/><div className="mt-1 text-right text-xs text-tertiary">{note.length}/200</div></div>
          <div className="mt-4 rounded-xl border border-surface-border bg-surface-container-lowest/45 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"><div className="flex items-start gap-3 min-w-0"><Icon name="location_on" size={24} className="text-accent-magenta shrink-0"/><div><p className="font-label-lg text-on-surface">Your location</p><p className="mt-1 text-sm text-secondary">{locationText}</p></div></div><button type="button" onClick={()=>void enableNearbyHelp()} disabled={nearbyBusy} className="shrink-0 rounded-full border border-accent-magenta px-4 py-2 text-sm font-bold text-accent-magenta transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60">{nearbyBusy?"Requesting…":locationBlocked?"Allow Location":"Update Location"}</button></div>
            {locationBlocked && !showLocationHelp ? <p className="mt-3 text-sm text-secondary">Tap Allow Location to ask your browser again. If Location is already allowed, SOS will use it automatically.</p> : null}
            {showLocationHelp ? <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4"><p className="font-bold text-on-surface">Still no Location prompt?</p><p className="mt-1 text-sm text-secondary">{locationHelpText()}</p><p className="mt-2 text-xs text-tertiary">After you change Location to Allow, tap Allow Location or Send SOS again. You do not need to stay on the lock-icon settings screen.</p></div> : null}
          </div>
          <button type="button" onClick={()=>void enableNearbyHelp()} disabled={nearbyBusy} className={`mt-4 w-full rounded-xl border px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${nearbyEnabled?"border-green-500/40 bg-green-500/10":"border-accent-magenta bg-accent-magenta/5 hover:bg-accent-magenta/10"}`}><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-accent-magenta text-white flex items-center justify-center"><Icon name="group" size={22}/></div><div className="flex-1 min-w-0"><p className="font-bold text-on-surface">Notify Nearby Help (within 25 km)</p><p className="mt-1 text-sm text-secondary">Allow location once so nearby emergency matching can work on this phone, tablet or computer.</p></div><div className={`h-7 w-12 rounded-full p-1 transition ${nearbyEnabled?"bg-green-500":"bg-accent-magenta"}`}><div className={`h-5 w-5 rounded-full bg-white transition-transform ${nearbyEnabled?"translate-x-5":"translate-x-0"}`}/></div></div></button>
          <button type="button" onClick={()=>void sendSOS()} disabled={sending} className="mt-4 w-full rounded-xl bg-gradient-to-r from-accent-magenta to-red-500 px-6 py-4 text-base font-extrabold text-white shadow-lg animate-sos-pulse transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-60">{sending?"SENDING SOS…":"SEND SOS ALERT"}</button>
          <p className="mt-3 text-center text-xs text-tertiary"><Icon name="lock" size={15} className="align-middle mr-1"/>Your exact location is shared only with Admin and emergency responders. It is not public.</p>{status?<p role="status" className="mt-4 rounded-xl border border-surface-border bg-surface-container-lowest/60 p-3 text-sm text-on-surface">{status}</p>:null}
        </div>
        <aside className="rounded-2xl border border-surface-border bg-surface-container-lowest/55 p-5 shadow-premium h-fit"><h2 className="font-headline-sm text-headline-sm text-on-surface">What happens next?</h2><div className="mt-5 space-y-5">{[["shield","1. Admins Notified","All Admins get your alert immediately."],["groups","2. Nearby Riders Alerted","Verified riders within 25 km with a recent location get the alert."],["motorcycle","3. Help on the Way","Responders can contact you and assist as quickly as possible."],["verified_user","4. You Stay Safe","Your emergency location stays restricted to Admin and responders."]].map(([icon,title,body])=><div key={title} className="flex gap-3"><div className="h-10 w-10 rounded-full bg-accent-magenta/15 text-accent-magenta flex items-center justify-center shrink-0"><Icon name={icon} size={22}/></div><div><p className="font-bold text-on-surface">{title}</p><p className="mt-1 text-sm text-secondary">{body}</p></div></div>)}</div></aside>
      </section>
      <section className="mb-6"><p className="font-label-caps text-label-caps text-accent-magenta mb-2">SheRides</p><h2 className="font-headline-lg text-headline-lg text-on-surface">Rider Benefits</h2><p className="mt-2 max-w-3xl font-body-md text-secondary">Safety, support, learning, maintenance and opportunity tools connected to the SheRides ecosystem.</p></section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">{benefits.map((item,index)=><article key={item.title} className="rounded-xl border border-surface-border bg-surface-container-lowest p-5 shadow-premium"><div className="flex items-start gap-4"><div className="h-11 w-11 shrink-0 rounded-full bg-accent-magenta/12 text-accent-magenta flex items-center justify-center"><Icon name={item.icon} size={24}/></div><div className="min-w-0 flex-1"><div className="flex items-start gap-2"><span className="mt-1 text-xs font-semibold text-accent-magenta">{String(index+1).padStart(2,"0")}</span><h3 className="font-headline-sm text-headline-sm text-on-surface">{item.title}</h3></div><div className="mt-3 flex flex-wrap gap-2">{item.features.map((feature)=><span key={feature} className="rounded-full border border-surface-border bg-soft-off-white px-3 py-1 text-xs font-medium text-secondary">{feature}</span>)}</div><Link href={item.href} className="mt-4 inline-flex items-center gap-2 font-label-lg text-accent-magenta">{item.action}<Icon name="arrow_forward" size={18}/></Link></div></div></article>)}</section>
    </main>
  );
}
