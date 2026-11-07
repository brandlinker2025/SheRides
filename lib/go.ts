import type { SupabaseClient } from "@supabase/supabase-js";

export type GoRole = "passenger" | "rider";
export type GoAppStatus = "pending" | "approved" | "rejected" | "suspended";
export type GoRideKind = "now" | "scheduled" | "hire";
export type GoRideStatus = "requested" | "accepted" | "in_progress" | "completed" | "cancelled";

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

/** Mirrors public.go_fare in the database (the database value is the one charged). */
export function estimateFare(kind: GoRideKind, distanceKm: number | null, hireHours: number | null) {
  if (kind === "hire") return 250 * Math.max(1, hireHours ?? 1);
  return Math.max(70, Math.round(30 + 14 * (distanceKm ?? 0)));
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
  return `৳${value.toLocaleString("en-BD")}`;
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
  if (/go_applications|go_rides|go_request_ride|go_submit_application|function .* does not exist|relation .* does not exist/i.test(message)) {
    return "SheRides Go is still being set up. Please try again later.";
  }
  return message || "Something went wrong. Please try again.";
}
