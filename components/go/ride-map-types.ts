import type { GoPlace } from "@/lib/go";
import type { MapPoint, RouteQuote } from "@/lib/map/route";

export type MapCaptain = { lat: number; lng: number; stale?: boolean };

export type RideMapProps = {
  pickup?: GoPlace | null;
  drop?: GoPlace | null;
  stops?: GoPlace[];
  captain?: MapCaptain | null;
  /** Straight visual from the captain to the next point. Not sent to the router. */
  approach?: { from: MapPoint; to: MapPoint } | null;
  interactive?: boolean;
  className?: string;
  onPickup?: (place: GoPlace) => void;
  onDrop?: (place: GoPlace) => void;
  onStop?: (index: number, place: GoPlace) => void;
  /** Distance and ETA for the pickup-to-drop route. Key matches those two points. */
  onRoute?: (quote: RouteQuote | null, key: string) => void;
};
