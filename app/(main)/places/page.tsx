"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlaceInput } from "@/components/go/PlaceInput";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useLocale } from "@/lib/locale";
import type { GoPlace } from "@/lib/go";
import { deletePlace, loadSavedPlaces, savePlace, type SavedPlace } from "@/lib/saved-places";
import { createClient } from "@/lib/supabase/client";

type Favourite = { id: string; name: string };

export default function PlacesPage() {
  const { t } = useLocale();
  const [draft, setDraft] = useState<GoPlace | null>(null);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const refresh = useCallback(async () => {
    setPlaces(await loadSavedPlaces());
    const supabase = createClient();
    if (!supabase) {
      setFavourites(namesFromLocal());
      return;
    }
    const { data, error } = await supabase
      .from("go_favourite_riders")
      .select("rider_id, rider:profiles!go_favourite_riders_rider_id_fkey(full_name)")
      .order("created_at", { ascending: false });
    if (error || !data) {
      setFavourites(namesFromLocal());
      return;
    }
    setFavourites(
      (data as { rider_id: string; rider: { full_name: string } | { full_name: string }[] | null }[]).map((row) => {
        const rider = Array.isArray(row.rider) ? row.rider[0] : row.rider;
        return { id: row.rider_id, name: rider?.full_name ?? "Captain" };
      }),
    );
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function store(slot: SavedPlace["slot"]) {
    if (!draft) {
      setMessage("Choose a place from the suggestions.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await savePlace({ slot, label: draft.label, lat: draft.lat, lng: draft.lng });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(result.synced ? "Saved to your account." : "Saved on this phone. It will sync after the database update.");
    setDraft(null);
    setFormKey((value) => value + 1);
    await refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    const result = await deletePlace(id);
    setBusy(false);
    setMessage(result.ok ? null : result.error);
    if (result.ok) await refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-8">
      <header>
        <Logo variant="badge" height={36} />
        <h1 className="text-2xl font-bold">{t("places.title")}</h1>
        <p className="mt-1 text-sm text-white/70">{t("places.lead")}</p>
      </header>

      <section className="card-surface flex flex-col gap-3 p-4">
        <PlaceInput key={formKey} label="Place" icon="location_on" value={draft} onChange={setDraft} placeholder="Search a landmark in Bangladesh" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn btn-primary flex-1" disabled={busy} onClick={() => void store("home")}>
            {t("places.home")}
          </button>
          <button type="button" className="btn btn-secondary flex-1" disabled={busy} onClick={() => void store("work")}>
            {t("places.work")}
          </button>
          <button type="button" className="btn btn-ghost flex-1" disabled={busy} onClick={() => void store("other")}>
            {t("places.other")}
          </button>
        </div>
        {message && <p className="text-sm text-white/70" role="status">{message}</p>}
      </section>

      <section className="flex flex-col gap-2">
        {places.length === 0 && <p className="card-surface p-6 text-center text-sm text-white/70">{t("places.empty")}</p>}
        {places.map((place) => (
          <article key={place.id} className="card-surface flex items-center gap-3 p-4">
            <Icon name={place.slot === "home" ? "home" : place.slot === "work" ? "work" : "bookmark"} className="text-[#ddb7ff]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#ffb95f]">{place.slot}</p>
              <p className="truncate font-semibold">{place.label}</p>
            </div>
            <button type="button" className="btn btn-ghost h-10 min-h-10 px-3 text-xs" disabled={busy} onClick={() => void remove(place.id)}>
              {t("places.delete")}
            </button>
          </article>
        ))}
      </section>

      <section className="card-surface p-5">
        <h2 className="text-lg font-bold">{t("places.favourites")}</h2>
        {favourites.length === 0 ? (
          <p className="mt-2 text-sm text-white/70">{t("places.favouritesEmpty")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {favourites.map((captain) => (
              <li key={captain.id} className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="favorite" filled className="text-[#f4b8d4]" size={18} />
                {captain.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/go" className="btn btn-primary">
        <Icon name="two_wheeler" size={20} />
        {t("places.book")}
      </Link>
    </div>
  );
}

function namesFromLocal(): Favourite[] {
  try {
    const named = JSON.parse(window.localStorage.getItem("sherides.favourite-names.v1") ?? "{}") as Record<string, string>;
    return Object.entries(named).map(([id, name]) => ({ id, name }));
  } catch {
    return [];
  }
}
