import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { roadKm } from "./go";
import { inBangladesh, placesFromNominatim, placesFromPhoton } from "./map/places";
import { estimateRoute, routeFromOsrm } from "./map/route";

test("geocoder results stay inside Bangladesh", () => {
  const nominatim = placesFromNominatim([
    { display_name: "Gulshan, Dhaka, Dhaka Division, Bangladesh", lat: "23.79", lon: "90.41" },
    { display_name: "Delhi, India", lat: "28.61", lon: "77.21" },
    { display_name: "Broken", lat: "nope", lon: "90" },
  ]);
  assert.equal(nominatim.length, 1);
  assert.equal(nominatim[0].label, "Gulshan, Dhaka, Dhaka Division, Bangladesh");
  assert.equal(inBangladesh(23.79, 90.41), true);
  assert.equal(inBangladesh(28.61, 77.21), false);

  const photon = placesFromPhoton([
    {
      geometry: { coordinates: [90.3742, 23.7461] },
      properties: { name: "Dhanmondi", city: "Dhaka", state: "Dhaka Division", countrycode: "BD" },
    },
    {
      geometry: { coordinates: [90.41, 23.8] },
      properties: { name: "Not here", countrycode: "IN" },
    },
  ]);
  assert.deepEqual(photon, [{ label: "Dhanmondi, Dhaka, Dhaka Division", lat: 23.7461, lng: 90.3742 }]);
});

test("OSRM distance and duration feed the fare route, with a local fallback", () => {
  const fallback = estimateRoute([
    { lat: 23.79, lng: 90.41 },
    { lat: 23.75, lng: 90.38 },
  ]);
  assert.ok(fallback);
  assert.equal(fallback.source, "estimate");
  assert.equal(fallback.km, roadKm({ lat: 23.79, lng: 90.41 }, { lat: 23.75, lng: 90.38 }));
  assert.equal(fallback.minutes, Math.max(4, Math.round((fallback.km / 26) * 60)));

  const routed = routeFromOsrm(
    {
      code: "Ok",
      routes: [{ distance: 8450, duration: 1080, geometry: { coordinates: [[90.41, 23.79], [90.39, 23.77], [90.38, 23.75]] } }],
    },
    fallback,
  );
  assert.equal(routed.source, "osrm");
  assert.equal(routed.km, 8.45);
  assert.equal(routed.minutes, 18);
  assert.equal(routed.coordinates.length, 3);

  assert.equal(routeFromOsrm({ code: "NoRoute", routes: [] }, fallback), fallback);
});

test("map hosts stay in the content security policy and the map stays off the server", () => {
  const config = readFileSync(new URL("../next.config.mjs", import.meta.url), "utf8");
  assert.match(config, /https:\/\/tiles\.openfreemap\.org/);
  assert.match(config, /https:\/\/photon\.komoot\.io/);
  assert.match(config, /https:\/\/router\.project-osrm\.org/);
  assert.match(config, /https:\/\/nominatim\.openstreetmap\.org/);
  assert.match(config, /worker-src 'self' blob:/);

  const wrapper = readFileSync(new URL("../components/go/RideMap.tsx", import.meta.url), "utf8");
  assert.match(wrapper, /ssr:\s*false/);
  assert.doesNotMatch(wrapper, /maplibre-gl/);
});
