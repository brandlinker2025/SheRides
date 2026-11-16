import type { GoPlace } from "@/lib/go";

/** Bangladesh bounding box. Search results outside it are dropped. */
export const BANGLADESH = {
  minLat: 20.55,
  maxLat: 26.64,
  minLng: 88.0,
  maxLng: 92.68,
};

export const DHAKA = { lat: 23.8103, lng: 90.4125 };

const NOMINATIM_GAP_MS = 1100;

export function inBangladesh(lat: number, lng: number) {
  return lat >= BANGLADESH.minLat && lat <= BANGLADESH.maxLat && lng >= BANGLADESH.minLng && lng <= BANGLADESH.maxLng;
}

export function coordinateLabel(lat: number, lng: number) {
  return `My location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}

export function isAbort(error: unknown) {
  return Boolean(error && typeof error === "object" && "name" in error && (error as { name?: string }).name === "AbortError");
}

type NominatimRow = { display_name?: string; lat?: string; lon?: string };

export function placesFromNominatim(rows: NominatimRow[]): GoPlace[] {
  const places: GoPlace[] = [];
  for (const row of rows) {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!row.display_name || !Number.isFinite(lat) || !Number.isFinite(lng) || !inBangladesh(lat, lng)) continue;
    places.push({
      label: row.display_name.split(", ").slice(0, 4).join(", "),
      lat,
      lng,
    });
  }
  return places;
}

type PhotonFeature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

export function placesFromPhoton(features: PhotonFeature[]): GoPlace[] {
  const places: GoPlace[] = [];
  for (const feature of features) {
    const [lng, lat] = feature.geometry?.coordinates ?? [];
    const props = feature.properties ?? {};
    if (props.countrycode && props.countrycode.toUpperCase() !== "BD") continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inBangladesh(lat, lng)) continue;
    const label = [props.name, props.street, props.city || props.district, props.state].filter(Boolean).slice(0, 4).join(", ");
    if (!label) continue;
    places.push({ label, lat, lng });
  }
  return places;
}

let geocodeChain: Promise<void> = Promise.resolve();
let lastGeocodeAt = 0;

/** Nominatim asks for at most one request a second. Photon shares the same queue. */
function pace<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  const run = geocodeChain.then(async () => {
    if (signal?.aborted) throw abortError();
    const wait = Math.max(0, NOMINATIM_GAP_MS - (Date.now() - lastGeocodeAt));
    if (wait > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, wait);
        const onAbort = () => {
          clearTimeout(timer);
          reject(abortError());
        };
        if (signal) {
          signal.addEventListener("abort", onAbort, { once: true });
        }
      });
    }
    if (signal?.aborted) throw abortError();
    lastGeocodeAt = Date.now();
    return task();
  });
  geocodeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function abortError() {
  const error = new Error("aborted");
  error.name = "AbortError";
  return error;
}

async function nominatimSearch(query: string, signal?: AbortSignal): Promise<GoPlace[] | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=bd&limit=6&accept-language=en,bn&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  return placesFromNominatim((await response.json()) as NominatimRow[]);
}

async function photonSearch(query: string, signal?: AbortSignal): Promise<GoPlace[]> {
  const url = `https://photon.komoot.io/api/?lang=en&limit=6&lat=${DHAKA.lat}&lon=${DHAKA.lng}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const body = (await response.json()) as { features?: PhotonFeature[] };
  return placesFromPhoton(body.features ?? []);
}

/** Bangladesh-biased search. Nominatim first, Photon when Nominatim is down. */
export async function searchBangladesh(query: string, signal?: AbortSignal): Promise<GoPlace[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const nominatim = await pace(() => nominatimSearch(q, signal), signal);
    if (nominatim) return nominatim;
  } catch (error) {
    if (isAbort(error)) throw error;
  }
  try {
    return await pace(() => photonSearch(q, signal), signal);
  } catch (error) {
    if (isAbort(error)) throw error;
    return [];
  }
}

async function nominatimReverse(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en,bn&zoom=17&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const row = (await response.json()) as { display_name?: string };
  if (!row.display_name) return null;
  return row.display_name.split(", ").slice(0, 4).join(", ");
}

async function photonReverse(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const body = (await response.json()) as { features?: PhotonFeature[] };
  return placesFromPhoton(body.features ?? [])[0]?.label ?? null;
}

/** Reverse geocode. Falls back to coordinates when both free services fail. */
export async function reverseBangladesh(lat: number, lng: number, signal?: AbortSignal): Promise<string> {
  if (!inBangladesh(lat, lng)) return coordinateLabel(lat, lng);
  try {
    const nominatim = await pace(() => nominatimReverse(lat, lng, signal), signal);
    if (nominatim) return nominatim;
  } catch (error) {
    if (isAbort(error)) throw error;
  }
  try {
    const photon = await pace(() => photonReverse(lat, lng, signal), signal);
    if (photon) return photon;
  } catch (error) {
    if (isAbort(error)) throw error;
  }
  return coordinateLabel(lat, lng);
}
