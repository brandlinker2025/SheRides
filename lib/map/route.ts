import { roadKm } from "@/lib/go";

export type MapPoint = { lat: number; lng: number };

export type RouteQuote = {
  km: number;
  minutes: number;
  source: "osrm" | "estimate";
};

export type RideRoute = RouteQuote & {
  coordinates: [number, number][];
};

type OsrmResponse = {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: { coordinates?: [number, number][] };
  }>;
};

const cache = new Map<string, RideRoute>();

export function routeKey(points: MapPoint[]) {
  return points.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join(";");
}

/** Straight-line road factor used when the public OSRM demo is unavailable. */
export function estimateRoute(points: MapPoint[]): RideRoute | null {
  if (points.length < 2) return null;
  let km = 0;
  for (let index = 1; index < points.length; index += 1) {
    km += roadKm(points[index - 1], points[index]);
  }
  km = Math.round(km * 100) / 100;
  return {
    km,
    minutes: Math.max(4, Math.round((km / 26) * 60)),
    coordinates: points.map((point) => [point.lng, point.lat]),
    source: "estimate",
  };
}

export function routeFromOsrm(body: OsrmResponse, fallback: RideRoute): RideRoute {
  const route = body.code === "Ok" ? body.routes?.[0] : undefined;
  const coordinates = route?.geometry?.coordinates;
  if (!route || !coordinates?.length || route.distance == null || route.duration == null) return fallback;
  if (!Number.isFinite(route.distance) || !Number.isFinite(route.duration)) return fallback;
  return {
    km: Math.round((route.distance / 1000) * 100) / 100,
    minutes: Math.max(1, Math.round(route.duration / 60)),
    coordinates,
    source: "osrm",
  };
}

function isAbort(error: unknown) {
  return Boolean(error && typeof error === "object" && "name" in error && (error as { name?: string }).name === "AbortError");
}

/**
 * Driving route from the public OSRM demo. One request per rounded endpoint pair,
 * cached in memory. Any failure returns the local road estimate.
 */
export async function fetchRideRoute(points: MapPoint[], signal?: AbortSignal): Promise<RideRoute | null> {
  const estimate = estimateRoute(points);
  if (!estimate) return null;
  const key = routeKey(points);
  const cached = cache.get(key);
  if (cached) return cached;
  const path = points.map((point) => `${point.lng.toFixed(5)},${point.lat.toFixed(5)}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&alternatives=false&steps=false`;
  try {
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) return estimate;
    const route = routeFromOsrm((await response.json()) as OsrmResponse, estimate);
    if (route.source === "osrm") {
      cache.set(key, route);
      if (cache.size > 40) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
    }
    return route;
  } catch (error) {
    if (isAbort(error)) throw error;
    return estimate;
  }
}
