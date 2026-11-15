import type { SupabaseClient } from "@supabase/supabase-js";

export type GoRole = "passenger" | "rider";
export type GoAppStatus = "pending" | "approved" | "rejected" | "suspended";
export type GoRideKind = "now" | "scheduled" | "hire";
export type GoRideStatus = "requested" | "accepted" | "in_progress" | "completed" | "cancelled";
export type GoService = "ev_bike" | "racing_bike" | "moto_155" | "scooter_light";

export type GoApplication = {
  id: string;
  user_id: string;
  role: GoRole;
  status: GoAppStatus;
  admin_notes: string | null;
  created_at: string;
};

export type GoRide = {
  id: string;
  passenger_id: string;
  rider_id: string | null;
  kind: GoRideKind;
  /** Set once the service-fare migration is applied. Older rows omit it. */
  service?: GoService | null;
  status: GoRideStatus;
  pickup_text: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  drop_text: string | null;
  drop_lat: number | null;
  drop_lng: number | null;
  distance_km: number | null;
  hire_hours: number | null;
  scheduled_at: string | null;
  fare: number;
  payment_method: "cash" | "bkash" | "nagad";
  note: string | null;
  rider_lat: number | null;
  rider_lng: number | null;
  rider_seen_at: string | null;
  passenger_rating: number | null;
  rider_rating: number | null;
  cancel_reason: string | null;
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export type GoPlace = { label: string; lat: number; lng: number };

export type FareTier = "premium" | "economical";

/**
 * Mirrors the rows seeded in public.go_fare_rates
 * (supabase/migrations/20261115120000_go_service_fare.sql).
 * The booking screen uses these numbers until that table is installed,
 * then replaces them with go_list_fare_rates().
 */
export type FareRate = {
  id: GoService;
  label: string;
  detail: string;
  tier: FareTier;
  slabKm: number;
  basePerKm: number;
  extraPerKm: number;
  waitingPerMinute: number;
  /** Minutes of pickup wait included before the per-minute fee. */
  waitingGraceMinutes: number;
  icon: string;
  pickupMin: number;
};

export const FARE_RATES: FareRate[] = [
  {
    id: "ev_bike",
    label: "EV Bikes",
    detail: "Electric motorcycles and scooters",
    tier: "premium",
    slabKm: 5,
    basePerKm: 30,
    extraPerKm: 20,
    waitingPerMinute: 1.5,
    waitingGraceMinutes: 3,
    icon: "electric_moped",
    pickupMin: 3,
  },
  {
    id: "racing_bike",
    label: "Racing Bikes",
    detail: "High-performance sports bikes",
    tier: "premium",
    slabKm: 5,
    basePerKm: 30,
    extraPerKm: 20,
    waitingPerMinute: 1.5,
    waitingGraceMinutes: 3,
    icon: "sports_motorsports",
    pickupMin: 4,
  },
  {
    id: "moto_155",
    label: "Motorcycles (155cc)",
    detail: "155cc",
    tier: "premium",
    slabKm: 5,
    basePerKm: 30,
    extraPerKm: 20,
    waitingPerMinute: 1.5,
    waitingGraceMinutes: 3,
    icon: "two_wheeler",
    pickupMin: 5,
  },
  {
    id: "scooter_light",
    label: "Scooters & Light Bikes",
    detail: "125cc and 113cc",
    tier: "economical",
    slabKm: 5,
    basePerKm: 30,
    extraPerKm: 15,
    waitingPerMinute: 1.5,
    waitingGraceMinutes: 3,
    icon: "moped",
    pickupMin: 4,
  },
];

export const RIDE_SERVICES = FARE_RATES;

export const SERVICE_LABEL: Record<GoService, string> = {
  ev_bike: "SheRides EV Green",
  racing_bike: "SheRides Racing Sport",
  moto_155: "SheRides Moto 155cc",
  scooter_light: "SheRides Scooty 113cc–125cc",
};

/** Marketing copy for the sanctuary fleet cards. Fares still come from FARE_RATES. */
export const FLEET_COPY: Record<GoService, { title: string; badge: string; blurb: string; perk: string }> = {
  ev_bike: {
    title: "SheRides EV Green",
    badge: "Eco EV",
    blurb: "Electric Motorcycle & Scooter • Silent & zero-emission",
    perk: "Clean helmet",
  },
  racing_bike: {
    title: "SheRides Racing Sport",
    badge: "Premium Speed",
    blurb: "R15 / Gixxer SF • Premium high-performance tier",
    perk: "Helmet",
  },
  moto_155: {
    title: "SheRides Moto 155cc",
    badge: "Standard 155cc",
    blurb: "FZ-S / Pulsar NS160 • Standard base performance tier",
    perk: "Helmet",
  },
  scooter_light: {
    title: "SheRides Scooty 113cc–125cc",
    badge: "Economical",
    blurb: "Activa / RayZR / Pleasure+ • Most economical commuter tier",
    perk: "Sanitized helmet",
  },
};

const SERVICES = new Set<string>(FARE_RATES.map((rate) => rate.id));

export function rateFor(service: GoService | string | null | undefined, rates: FareRate[] = FARE_RATES) {
  return rates.find((rate) => rate.id === service) ?? rates[0] ?? FARE_RATES[0];
}

export function serviceLabel(service: string | null | undefined) {
  if (!service || !SERVICES.has(service)) return null;
  return SERVICE_LABEL[service as GoService];
}

/**
 * Fare charged by the original `go_fare()` still installed in production
 * (supabase/migrations/20261108090000_sherides_go.sql): ৳70 minimum, else ৳30 + ৳14/km.
 * The booking screen uses this until `go_list_fare_rates()` exists.
 */
export function legacyDistanceFare(distanceKm: number) {
  const km = Math.max(0, distanceKm);
  return Math.max(70, Math.round(30 + 14 * km));
}

/** Keep the rider's own note when a vehicle preference is attached. Never cut the note to make room for the tag. */
export function rideNoteWithPreference(preference: string, userNote: string, max = 300) {
  const note = userNote.trim();
  const tag = preference.trim();
  if (!tag) return note.slice(0, max) || null;
  if (!note) return tag.slice(0, max);
  const joiner = " · ";
  if (tag.length + joiner.length + note.length <= max) return `${tag}${joiner}${note}`;
  return note.slice(0, max);
}

/** Distance fare from a stored rate. 5 km is ৳150. Premium extra is ৳20/km, economical is ৳15/km. */
export function distanceFare(distanceKm: number, service: GoService | string = "ev_bike", rates: FareRate[] = FARE_RATES) {
  const rate = rateFor(service, rates);
  const km = Math.max(0, distanceKm);
  const raw =
    km <= rate.slabKm
      ? rate.basePerKm * km
      : rate.slabKm * rate.basePerKm + rate.extraPerKm * (km - rate.slabKm);
  return Math.round(raw);
}

/** Potential waiting charge from the stored per-minute rate. Not included in the distance fare. */
export function waitingFee(minutes: number, service: GoService | string = "ev_bike", rates: FareRate[] = FARE_RATES) {
  const perMinute = rateFor(service, rates).waitingPerMinute;
  return Math.round(Math.max(0, minutes) * perMinute * 100) / 100;
}

export function estimateFare(kind: GoRideKind, distanceKm: number | null, hireHours: number | null, service: GoService | string = "ev_bike", rates: FareRate[] = FARE_RATES) {
  if (kind === "hire") return 250 * Math.max(1, hireHours ?? 1);
  return distanceFare(distanceKm ?? 0, service, rates);
}

export function estimateServiceFare(service: GoService, kind: GoRideKind, distanceKm: number | null, hireHours: number | null, rates: FareRate[] = FARE_RATES) {
  return estimateFare(kind, distanceKm, hireHours, service, rates);
}

type FareCatalogRow = {
  service: string;
  label: string;
  tier: string;
  slab_km: number | string;
  base_per_km: number | string;
  extra_per_km: number | string;
  waiting_per_minute: number | string;
  waiting_grace_minutes?: number | string | null;
};

/** Turn go_list_fare_rates() rows into the same shape the booking screen calculates with. */
export function ratesFromCatalog(rows: FareCatalogRow[] | null | undefined): FareRate[] {
  if (!rows?.length) return FARE_RATES;
  const merged: FareRate[] = [];
  for (const row of rows) {
    if (!SERVICES.has(row.service)) continue;
    if (row.tier !== "premium" && row.tier !== "economical") continue;
    const local = FARE_RATES.find((rate) => rate.id === row.service)!;
    merged.push({
      ...local,
      label: row.label || local.label,
      tier: row.tier,
      slabKm: Number(row.slab_km),
      basePerKm: Number(row.base_per_km),
      extraPerKm: Number(row.extra_per_km),
      waitingPerMinute: Number(row.waiting_per_minute),
      waitingGraceMinutes: row.waiting_grace_minutes == null ? local.waitingGraceMinutes : Number(row.waiting_grace_minutes),
    });
  }
  return merged.length ? merged : FARE_RATES;
}

/** Typical minutes until pickup, plus a road-time estimate once a destination exists. */
export function estimatePickupMinutes(service: GoService, distanceKm: number | null) {
  const base = RIDE_SERVICES.find((item) => item.id === service)?.pickupMin ?? 4;
  if (distanceKm == null) return base;
  return base + Math.min(8, Math.round(distanceKm / 4));
}

export function estimateTripMinutes(_service: GoService, distanceKm: number | null) {
  if (distanceKm == null) return null;
  return Math.max(4, Math.round((distanceKm / 26) * 60));
}

/** Mirrors public.go_distance_km: straight line x 1.3 for Dhaka roads. */
export function roadKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 1.3 * 100) / 100;
}

/** Free address search (OpenStreetMap Nominatim), limited to Bangladesh. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GoPlace[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=bd&limit=6&accept-language=en,bn&q=${encodeURIComponent(q)}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const rows = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return rows.map((row) => ({
    label: row.display_name.split(", ").slice(0, 4).join(", "),
    lat: Number(row.lat),
    lng: Number(row.lon),
  }));
}

export async function reversePlace(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en,bn&zoom=17&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("reverse failed");
    const row = (await response.json()) as { display_name?: string };
    if (row.display_name) return row.display_name.split(", ").slice(0, 4).join(", ");
  } catch {
    /* fall through */
  }
  return `My location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}

export function mapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function directionsLink(from: { lat: number; lng: number } | null, to: { lat: number; lng: number }) {
  const origin = from ? `&origin=${from.lat},${from.lng}` : "";
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${to.lat},${to.lng}&travelmode=two-wheeler`;
}

export const RIDE_STATUS_LABEL: Record<GoRideStatus, string> = {
  requested: "Finding a rider",
  accepted: "Rider on the way",
  in_progress: "On the ride",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const KIND_LABEL: Record<GoRideKind, string> = {
  now: "Ride now",
  scheduled: "Pre-booked",
  hire: "Hire",
};

export function formatTaka(value: number) {
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.abs(rounded - Math.round(rounded)) < 0.001;
  return `৳${rounded.toLocaleString("en-BD", whole ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatWhen(iso: string | null) {
  if (!iso) return "As soon as possible";
  return new Date(iso).toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const MAX_DOC_BYTES = 10 * 1024 * 1024;
const DOC_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

/** Upload one private document into verifications/<uid>/go/... and return its storage path. */
export async function uploadGoDocument(supabase: SupabaseClient, userId: string, file: File, label: string) {
  if (!DOC_TYPES.has(file.type)) throw new Error(`${label}: use a JPG, PNG, WebP photo or a PDF.`);
  if (file.size > MAX_DOC_BYTES) throw new Error(`${label}: file is larger than 10 MB.`);
  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/go/${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("verifications").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`${label}: ${error.message}`);
  return path;
}

/** Turn database errors into one readable line. */
export function goErrorMessage(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String((error as { message: string }).message) : "";
  if (/could not find the function|schema cache|does not exist|PGRST202|PGRST205/i.test(message)) {
    return "Ride booking is still being set up. Please try again later.";
  }
  return message || "Something went wrong. Please try again.";
}
