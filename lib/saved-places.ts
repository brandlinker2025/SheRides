import { createClient } from "@/lib/supabase/client";
import { rpcMissing } from "@/lib/ride-extras";

export type PlaceSlot = "home" | "work" | "other";

export type SavedPlace = {
  id: string;
  slot: PlaceSlot;
  label: string;
  lat: number;
  lng: number;
};

const KEY = "sherides.saved-places.v1";

function readLocal(): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as SavedPlace[];
    return Array.isArray(parsed) ? parsed.filter(isPlace) : [];
  } catch {
    return [];
  }
}

function writeLocal(places: SavedPlace[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(places));
  } catch {
    /* private mode */
  }
}

function isPlace(value: unknown): value is SavedPlace {
  if (!value || typeof value !== "object") return false;
  const place = value as SavedPlace;
  return (
    typeof place.id === "string" &&
    (place.slot === "home" || place.slot === "work" || place.slot === "other") &&
    typeof place.label === "string" &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

function mergeLocal(place: SavedPlace) {
  const current = readLocal().filter((item) => {
    if (place.slot === "home" || place.slot === "work") return item.slot !== place.slot;
    return item.id !== place.id;
  });
  writeLocal([place, ...current]);
}

export async function loadSavedPlaces(): Promise<SavedPlace[]> {
  const local = readLocal();
  const supabase = createClient();
  if (!supabase) return local;
  const { data, error } = await supabase
    .from("go_saved_places")
    .select("id, slot, label, lat, lng")
    .order("updated_at", { ascending: false });
  if (error || !data) return local;
  const places = (data as SavedPlace[]).filter(isPlace);
  writeLocal(places);
  return places;
}

export async function savePlace(input: {
  id?: string;
  slot: PlaceSlot;
  label: string;
  lat: number;
  lng: number;
}): Promise<{ ok: true; synced: boolean } | { ok: false; error: string }> {
  const supabase = createClient();
  if (!supabase) {
    mergeLocal({ id: input.id ?? crypto.randomUUID(), slot: input.slot, label: input.label, lat: input.lat, lng: input.lng });
    return { ok: true, synced: false };
  }
  const { error } = await supabase.rpc("go_save_place", {
    p_slot: input.slot,
    p_label: input.label,
    p_lat: input.lat,
    p_lng: input.lng,
    p_id: input.slot === "other" ? input.id ?? null : null,
  });
  if (error) {
    if (rpcMissing(error.message)) {
      mergeLocal({ id: input.id ?? crypto.randomUUID(), slot: input.slot, label: input.label, lat: input.lat, lng: input.lng });
      return { ok: true, synced: false };
    }
    return { ok: false, error: error.message };
  }
  await loadSavedPlaces();
  return { ok: true, synced: true };
}

export async function deletePlace(id: string): Promise<{ ok: true; synced: boolean } | { ok: false; error: string }> {
  const drop = () => writeLocal(readLocal().filter((place) => place.id !== id));
  const supabase = createClient();
  if (!supabase) {
    drop();
    return { ok: true, synced: false };
  }
  const { error } = await supabase.rpc("go_delete_place", { p_id: id });
  if (error) {
    if (!rpcMissing(error.message)) return { ok: false, error: error.message };
    drop();
    return { ok: true, synced: false };
  }
  drop();
  return { ok: true, synced: true };
}
