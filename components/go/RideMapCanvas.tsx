"use client";

import { useEffect, useRef, useState } from "react";
import { LngLatBounds, Map as MapLibreMap, Marker, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Icon } from "@/components/ui/Icon";
import { locationErrorMessage, requestRiderLocation } from "@/lib/geolocation";
import type { GoPlace } from "@/lib/go";
import { DHAKA_CENTER, MAP_COLORS, MAP_STYLE_URL } from "@/lib/map/brand";
import { coordinateLabel, reverseBangladesh } from "@/lib/map/places";
import { estimateRoute, fetchRideRoute, routeKey, type MapPoint, type RideRoute } from "@/lib/map/route";
import type { RideMapProps } from "./ride-map-types";

type PinKind = "pickup" | "drop" | "stop" | "captain" | "you";

const NO_STOPS: GoPlace[] = [];

const EMPTY_LINE = {
  type: "Feature" as const,
  properties: {},
  geometry: { type: "LineString" as const, coordinates: [] as [number, number][] },
};

function lineFeature(coordinates: [number, number][]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates },
  };
}

function pinElement(kind: PinKind, stale = false) {
  const el = document.createElement("div");
  el.className = `ride-pin ride-pin-${kind}${stale ? " is-stale" : ""}`;
  const head = document.createElement("span");
  const stem = document.createElement("i");
  el.append(head, stem);
  return el;
}

function samePoint(marker: Marker, point: MapPoint) {
  const current = marker.getLngLat();
  return Math.abs(current.lat - point.lat) < 1e-6 && Math.abs(current.lng - point.lng) < 1e-6;
}

function paddingFor(map: MapLibreMap) {
  const height = map.getContainer().clientHeight;
  const narrow = window.matchMedia("(max-width: 1023px)").matches;
  if (!narrow || height < 360) return { top: 92, right: 48, bottom: 28, left: 20 };
  return { top: 96, right: 24, bottom: Math.round(height * 0.56), left: 16 };
}

function ensureLines(map: MapLibreMap) {
  if (!map.getSource("route")) {
    map.addSource("route", { type: "geojson", data: EMPTY_LINE });
    map.addLayer({
      id: "route-casing",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#FFFFFF", "line-width": 9, "line-opacity": 0.95 },
    });
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": MAP_COLORS.purple, "line-width": 4.5 },
    });
  }
  if (!map.getSource("approach")) {
    map.addSource("approach", { type: "geojson", data: EMPTY_LINE });
    map.addLayer({
      id: "approach-line",
      type: "line",
      source: "approach",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": MAP_COLORS.coral,
        "line-width": 3,
        "line-dasharray": [1.2, 1.4],
        "line-opacity": 0.95,
      },
    });
  }
}

function tint(map: MapLibreMap) {
  if (map.getLayer("background")) map.setPaintProperty("background", "background-color", MAP_COLORS.paper);
  if (map.getLayer("water")) map.setPaintProperty("water", "fill-color", MAP_COLORS.water);
  if (map.getLayer("waterway")) map.setPaintProperty("waterway", "line-color", MAP_COLORS.waterway);
}

export default function RideMapCanvas({
  pickup = null,
  drop = null,
  stops = NO_STOPS,
  captain = null,
  approach = null,
  interactive = false,
  className,
  onPickup,
  onDrop,
  onStop,
  onRoute,
}: RideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef<Partial<Record<"pickup" | "drop" | "captain" | "you", Marker>>>({});
  const stopMarkers = useRef<Marker[]>([]);
  const dragging = useRef(false);
  const pinToken = useRef(0);
  const reverseAbort = useRef<AbortController | null>(null);
  const onPickupRef = useRef(onPickup);
  const onDropRef = useRef(onDrop);
  const onStopRef = useRef(onStop);
  const onRouteRef = useRef(onRoute);
  const interactiveRef = useRef(interactive);
  const modeRef = useRef<"pickup" | "drop">("pickup");
  const dropRef = useRef(drop);
  const publishRef = useRef<(kind: "pickup" | "drop" | "stop", lat: number, lng: number, index?: number) => void>(() => undefined);

  const [tileState, setTileState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [mapLive, setMapLive] = useState(false);
  const [styleReady, setStyleReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [mode, setMode] = useState<"pickup" | "drop">("pickup");
  const [you, setYou] = useState<MapPoint | null>(null);
  const [route, setRoute] = useState<RideRoute | null>(null);

  const endpoints = pickup && drop ? [pickup, drop] : null;
  const endpointsKey = endpoints ? routeKey(endpoints) : "";
  const endpointsRef = useRef(endpoints);

  const publish = (kind: "pickup" | "drop" | "stop", lat: number, lng: number, index = 0) => {
    reverseAbort.current?.abort();
    const controller = new AbortController();
    reverseAbort.current = controller;
    const token = ++pinToken.current;
    const draft: GoPlace = { label: coordinateLabel(lat, lng), lat, lng };
    if (kind === "pickup") onPickupRef.current?.(draft);
    else if (kind === "drop") onDropRef.current?.(draft);
    else onStopRef.current?.(index, draft);
    if (kind === "pickup" && !dropRef.current) setMode("drop");
    void reverseBangladesh(lat, lng, controller.signal)
      .then((label) => {
        if (pinToken.current !== token) return;
        const place = { label, lat, lng };
        if (kind === "pickup") onPickupRef.current?.(place);
        else if (kind === "drop") onDropRef.current?.(place);
        else onStopRef.current?.(index, place);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    onPickupRef.current = onPickup;
    onDropRef.current = onDrop;
    onStopRef.current = onStop;
    onRouteRef.current = onRoute;
    interactiveRef.current = interactive;
    modeRef.current = mode;
    dropRef.current = drop;
    endpointsRef.current = endpoints;
    publishRef.current = publish;
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    let map: MapLibreMap;
    try {
      setWorkerUrl("/maplibre-gl-worker.js");
      map = new MapLibreMap({
        container: element,
        style: MAP_STYLE_URL,
        center: DHAKA_CENTER,
        zoom: 11,
        attributionControl: false,
        maplibreLogo: false,
        dragRotate: false,
        pitchWithRotate: false,
        canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
      });
    } catch {
      setTileState("unavailable");
      setNote("This browser could not start the map. Search and fare still work.");
      return;
    }
    mapRef.current = map;
    setMapLive(true);
    map.touchZoomRotate.disableRotation();
    let failed = false;
    map.on("load", () => {
      tint(map);
      ensureLines(map);
      setStyleReady(true);
      map.resize();
      if (!failed) setTileState("ready");
    });
    map.on("idle", () => {
      if (!failed) setTileState("ready");
    });
    map.on("error", (event) => {
      const message = String(event.error?.message ?? "");
      if (failed || map.isStyleLoaded()) return;
      if (/worker|style|fetch|ajax|network|sprite/i.test(message)) {
        failed = true;
        setTileState("unavailable");
        setNote("Map tiles did not load. Search and fare still work.");
      }
    });
    map.on("click", (event) => {
      if (!interactiveRef.current || dragging.current) return;
      publishRef.current(modeRef.current, event.lngLat.lat, event.lngLat.lng);
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(element);
    return () => {
      observer.disconnect();
      reverseAbort.current?.abort();
      map.remove();
      mapRef.current = null;
      markers.current = {};
      stopMarkers.current = [];
      setMapLive(false);
      setStyleReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = interactive ? "crosshair" : "grab";
  }, [interactive, mapLive]);

  useEffect(() => {
    const points = endpointsRef.current;
    if (!points) {
      setRoute(null);
      onRouteRef.current?.(null, "");
      return;
    }
    const estimate = estimateRoute(points);
    setRoute(estimate);
    if (estimate) {
      onRouteRef.current?.({ km: estimate.km, minutes: estimate.minutes, source: estimate.source }, endpointsKey);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchRideRoute(points, controller.signal)
        .then((next) => {
          if (!next) return;
          setRoute(next);
          onRouteRef.current?.({ km: next.km, minutes: next.minutes, source: next.source }, endpointsKey);
        })
        .catch(() => undefined);
    }, 450);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [endpointsKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    ensureLines(map);
    const routeSource = map.getSource("route") as GeoJSONSource | undefined;
    const approachSource = map.getSource("approach") as GeoJSONSource | undefined;
    routeSource?.setData(route && route.coordinates.length > 1 ? lineFeature(route.coordinates) : EMPTY_LINE);
    approachSource?.setData(
      approach ? lineFeature([[approach.from.lng, approach.from.lat], [approach.to.lng, approach.to.lat]]) : EMPTY_LINE,
    );
  }, [route, approach, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sync = (
      kind: "pickup" | "drop" | "captain" | "you",
      point: MapPoint | null,
      options: { draggable?: boolean; stale?: boolean; onDrag?: (lat: number, lng: number) => void },
    ) => {
      const existing = markers.current[kind];
      if (!point) {
        existing?.remove();
        delete markers.current[kind];
        return;
      }
      if (!existing) {
        const marker = new Marker({
          element: pinElement(kind, options.stale),
          anchor: "bottom",
          draggable: Boolean(options.draggable),
        })
          .setLngLat([point.lng, point.lat])
          .addTo(map);
        marker.on("dragstart", () => {
          dragging.current = true;
        });
        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          options.onDrag?.(lngLat.lat, lngLat.lng);
          window.setTimeout(() => {
            dragging.current = false;
          }, 0);
        });
        markers.current[kind] = marker;
        return;
      }
      existing.setDraggable(Boolean(options.draggable));
      existing.getElement().className = `ride-pin ride-pin-${kind}${options.stale ? " is-stale" : ""}`;
      if (!samePoint(existing, point)) existing.setLngLat([point.lng, point.lat]);
    };

    sync("pickup", pickup, { draggable: interactive, onDrag: (lat, lng) => publishRef.current("pickup", lat, lng) });
    sync("drop", drop, { draggable: interactive, onDrag: (lat, lng) => publishRef.current("drop", lat, lng) });
    sync("captain", captain, { stale: captain?.stale });
    sync("you", you, {});

    while (stopMarkers.current.length > stops.length) stopMarkers.current.pop()?.remove();
    stops.forEach((stop, index) => {
      const existing = stopMarkers.current[index];
      if (!existing) {
        const marker = new Marker({
          element: pinElement("stop"),
          anchor: "bottom",
          draggable: interactive,
        })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);
        marker.on("dragstart", () => {
          dragging.current = true;
        });
        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          publishRef.current("stop", lngLat.lat, lngLat.lng, index);
          window.setTimeout(() => {
            dragging.current = false;
          }, 0);
        });
        stopMarkers.current[index] = marker;
        return;
      }
      existing.setDraggable(interactive);
      if (!samePoint(existing, stop)) existing.setLngLat([stop.lng, stop.lat]);
    });
  }, [pickup, drop, stops, captain, you, interactive, mapLive]);

  const captainBucket = captain ? `${captain.lat.toFixed(2)},${captain.lng.toFixed(2)}` : "";
  const anchorKey = [
    pickup ? `${pickup.lat.toFixed(5)},${pickup.lng.toFixed(5)}` : "",
    drop ? `${drop.lat.toFixed(5)},${drop.lng.toFixed(5)}` : "",
    stops.map((stop) => `${stop.lat.toFixed(5)},${stop.lng.toFixed(5)}`).join(","),
    route?.source ?? "",
    captainBucket,
  ].join("|");

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const points: MapPoint[] = [];
    if (route && route.coordinates.length > 1) {
      for (const [lng, lat] of route.coordinates) points.push({ lng, lat });
    } else {
      if (pickup) points.push(pickup);
      if (drop) points.push(drop);
    }
    for (const stop of stops) points.push(stop);
    if (captain) points.push(captain);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : 650;
    if (points.length === 0) {
      map.easeTo({ center: DHAKA_CENTER, zoom: 11, duration });
      return;
    }
    if (points.length === 1) {
      map.easeTo({ center: [points[0].lng, points[0].lat], zoom: 14, duration });
      return;
    }
    const bounds = new LngLatBounds();
    for (const point of points) bounds.extend([point.lng, point.lat]);
    map.fitBounds(bounds, { padding: paddingFor(map), duration, maxZoom: 15 });
    // Camera follows pins and the routed line. Captain updates inside ~1 km do not refit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorKey, styleReady]);

  async function locate() {
    setNote(null);
    setLocating(true);
    try {
      const position = await requestRiderLocation();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      if (interactiveRef.current) publishRef.current(modeRef.current, lat, lng);
      else {
        setYou({ lat, lng });
        mapRef.current?.easeTo({ center: [lng, lat], zoom: 15, duration: 600 });
      }
    } catch (error) {
      setNote(locationErrorMessage(error));
    } finally {
      setLocating(false);
    }
  }

  const summary = route
    ? `${route.km.toFixed(2)} km · ${route.minutes} min${route.source === "estimate" ? " · estimated" : ""}`
    : pickup || drop
      ? "Set pickup and drop-off to see the route"
      : "Search or tap the map";

  return (
    <section
      aria-label="Ride map"
      data-testid="ride-map"
      data-map-state={tileState}
      className={`ride-map relative overflow-hidden rounded-[28px] border border-[#460377]/15 bg-[#F4FBFF] ${className ?? "h-full min-h-[220px]"}`}
    >
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute left-3 top-3 flex max-w-[calc(100%-4.5rem)] flex-col items-start gap-1.5">
          <p className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#460377] shadow-lg">
            Female captains
          </p>
          <p data-testid="route-summary" aria-live="polite" className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#1B1324] shadow-lg">
            {summary}
            {captain?.stale ? " · signal weak" : ""}
          </p>
          <p className="pointer-events-auto rounded-full bg-white/95 px-2.5 py-1 text-[10px] leading-snug text-[#1B1324]/75 shadow">
            <a className="underline" href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a>
            {" · © "}
            <a className="underline" href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a>
            {" · "}
            <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
          </p>
        </div>
        <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => void locate()}
            disabled={locating}
            aria-label="Use my current location"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#460377] shadow-lg disabled:opacity-60"
          >
            <Icon name={locating ? "hourglass_top" : "my_location"} />
          </button>
          {interactive && (
            <div className="flex rounded-full bg-white p-1 shadow-lg" role="group" aria-label="Pin to place">
              {(["pickup", "drop"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={mode === kind}
                  onClick={() => setMode(kind)}
                  className={`h-11 rounded-full px-3 text-xs font-bold ${mode === kind ? (kind === "pickup" ? "bg-[#FF6772] text-white" : "bg-[#FFB804] text-[#460377]") : "text-[#1B1324]/70"}`}
                >
                  {kind === "pickup" ? "Pickup" : "Drop"}
                </button>
              ))}
            </div>
          )}
        </div>
        {note && (
          <p role="status" className="absolute inset-x-3 bottom-3 rounded-2xl bg-white px-3 py-2 text-sm text-[#460377] shadow-lg">
            {note}
          </p>
        )}
        {tileState === "unavailable" && (
          <p role="status" className="absolute inset-x-3 top-28 rounded-2xl border border-[#460377]/15 bg-white px-3 py-2 text-sm text-[#1B1324]">
            The live map could not be drawn. Pickup and drop-off from search still work.
          </p>
        )}
      </div>
    </section>
  );
}
