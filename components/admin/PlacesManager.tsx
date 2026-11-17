"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlaceInput } from "@/components/go/PlaceInput";
import { Icon } from "@/components/ui/Icon";
import { clearSheRidesPlacesCache, mapsLink, type GoPlace } from "@/lib/go";
import { createClient } from "@/lib/supabase/client";

type Place = { id: string; name: string; area: string | null; lat: number; lng: number };

export function PlacesManager({ places }: { places: Place[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [spot, setSpot] = useState<GoPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);

  async function save() {
    setMsg(null);
    if (name.trim().length < 2) return setMsg({ error: "জায়গার নাম লিখুন।" });
    if (!spot) return setMsg({ error: "ম্যাপে বা খুঁজে জায়গাটা বেছে নিন।" });
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("go_places").insert({
      name: name.trim().slice(0, 100),
      area: area.trim().slice(0, 100) || null,
      lat: spot.lat,
      lng: spot.lng,
      created_by: auth.user?.id ?? null,
    });
    setBusy(false);
    if (error) return setMsg({ error: error.message });
    clearSheRidesPlacesCache();
    setMsg({ ok: `"${name.trim()}" যোগ হয়েছে। এখন খুঁজলেই পাওয়া যাবে।` });
    setName("");
    setArea("");
    setSpot(null);
    router.refresh();
  }

  async function remove(place: Place) {
    if (!window.confirm(`"${place.name}" তালিকা থেকে সরাবেন?`)) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from("go_places").update({ active: false }).eq("id", place.id);
    if (error) return setMsg({ error: error.message });
    clearSheRidesPlacesCache();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="card-surface p-5 flex flex-col gap-3" aria-label="Add a place">
        <h2 className="text-lg font-bold flex items-center gap-2"><Icon name="add_location_alt" /> নতুন জায়গা যোগ করুন</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="নাম (যেমন Yamaha Flagship Center)" className="h-12 rounded-xl border border-surface-border bg-soft-off-white px-4" />
          <input value={area} onChange={(e) => setArea(e.target.value)} maxLength={100} placeholder="এলাকা (যেমন Tejgaon)" className="h-12 rounded-xl border border-surface-border bg-soft-off-white px-4" />
        </div>
        <PlaceInput
          label="ম্যাপে লোকেশন (ম্যাপে বেছে নিন / আশেপাশের রাস্তা খুঁজুন)"
          icon="location_on"
          value={spot}
          onChange={setSpot}
          allowCurrentLocation
          placeholder="কাছের রাস্তা বা এলাকা লিখুন, তারপর ম্যাপে ঠিক করুন"
        />
        {spot && <p className="font-body-sm text-secondary">বেছে নেওয়া বিন্দু: {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}</p>}
        <button type="button" disabled={busy} onClick={() => void save()} className="btn btn-primary h-12 self-start px-6">
          <Icon name="check" size={20} /> {busy ? "Saving…" : "Save place"}
        </button>
        {msg?.ok && <p className="font-body-sm text-green-700" role="status">{msg.ok}</p>}
        {msg?.error && <p className="font-body-sm text-error" role="alert">{msg.error}</p>}
      </section>

      <section className="flex flex-col gap-2" aria-label="Saved places">
        <h2 className="text-lg font-bold">SheRides places ({places.length})</h2>
        {places.length === 0 && <p className="card-surface p-5 text-center font-body-sm text-secondary">এখনো কোনো জায়গা যোগ হয়নি।</p>}
        {places.map((place) => (
          <div key={place.id} className="card-surface flex items-center gap-3 p-3">
            <Icon name="location_on" className="text-accent-magenta" />
            <div className="min-w-0 flex-1">
              <p className="font-label-lg truncate">{place.name}</p>
              <p className="font-body-sm text-secondary truncate">{place.area ?? "—"}</p>
            </div>
            <a href={mapsLink(place.lat, place.lng)} target="_blank" rel="noreferrer" className="btn btn-secondary h-10 min-h-10 px-4 text-sm">Map</a>
            <button type="button" onClick={() => void remove(place)} className="btn btn-secondary h-10 min-h-10 px-4 text-sm">Remove</button>
          </div>
        ))}
      </section>
    </div>
  );
}
