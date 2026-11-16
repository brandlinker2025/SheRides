import assert from "node:assert/strict";
import { test } from "node:test";
import { FARE_RATES, distanceFare, estimateServiceFare, formatTaka, goErrorMessage, legacyDistanceFare, quoteRideRequest, ratesFromCatalog, rideNoteWithPreference, roadKm, waitingFee } from "./go";

test("5 km is 150 BDT on every category", () => {
  for (const rate of FARE_RATES) {
    assert.equal(distanceFare(5, rate.id), 150);
    assert.equal(estimateServiceFare(rate.id, "now", 5, null), 150);
  }
});

test("8 km is 210 on premium and 195 on economical", () => {
  for (const id of ["ev_bike", "racing_bike", "moto_155"] as const) {
    assert.equal(distanceFare(8, id), 210);
    assert.equal(distanceFare(8, id), 150 + 3 * 20);
  }
  assert.equal(distanceFare(8, "scooter_light"), 195);
  assert.equal(distanceFare(8, "scooter_light"), 150 + 3 * 15);
});

test("catalog rows override the local mirror and drop unknown vehicles", () => {
  const rates = ratesFromCatalog([
    { service: "scooter_light", label: "Scooters & Light Bikes", tier: "economical", slab_km: "5", base_per_km: "30", extra_per_km: "15", waiting_per_minute: "1.50" },
    { service: "car", label: "Car", tier: "premium", slab_km: 5, base_per_km: 30, extra_per_km: 40, waiting_per_minute: 1.5 },
    { service: "cng", label: "CNG", tier: "economical", slab_km: 5, base_per_km: 30, extra_per_km: 10, waiting_per_minute: 1.5 },
  ]);
  assert.deepEqual(rates.map((rate) => rate.id), ["scooter_light"]);
  assert.equal(distanceFare(8, "scooter_light", rates), 195);
});

test("legacy server fare matches the installed go_fare formula", () => {
  assert.equal(legacyDistanceFare(0), 70);
  assert.equal(legacyDistanceFare(1), 70);
  assert.equal(legacyDistanceFare(5), 100);
  assert.equal(legacyDistanceFare(10), 170);
});

test("vehicle preference does not replace a long pickup note", () => {
  assert.equal(rideNoteWithPreference("Vehicle: EV", ""), "Vehicle: EV");
  assert.equal(rideNoteWithPreference("Vehicle: EV", "Gate 2"), "Vehicle: EV · Gate 2");
  const longNote = "A".repeat(300);
  assert.equal(rideNoteWithPreference("Vehicle: EV", longNote), longNote);
});

test("business ride errors stay readable", () => {
  assert.equal(goErrorMessage({ message: "You already have an active ride." }), "You already have an active ride.");
  assert.match(goErrorMessage({ message: "Could not find the function public.go_request_ride" }), /still being set up/);
});

test("waiting is 1.50 per minute and stays off the distance fare", () => {
  assert.equal(waitingFee(1, "ev_bike"), 1.5);
  assert.equal(waitingFee(1, "scooter_light"), 1.5);
  assert.equal(formatTaka(waitingFee(1)), "৳1.50");
  assert.equal(FARE_RATES.every((rate) => rate.waitingPerMinute === 1.5), true);
  const catalog = JSON.stringify(FARE_RATES).toLowerCase();
  assert.equal(catalog.includes("cng"), false);
  assert.equal(catalog.includes("\"car\""), false);
});

test("booking quote uses OSRM route distance and admin fare settings for both preview and saved ride", () => {
  const pickup = { lat: 23.7946, lng: 90.415 };
  const drop = { lat: 23.7556, lng: 90.376 };
  const osrmKm = 8.45;
  const straightKm = roadKm(pickup, drop);
  assert.notEqual(osrmKm, straightKm);

  const adminRates = ratesFromCatalog([
    { service: "ev_bike", label: "EV Bikes", tier: "premium", slab_km: 5, base_per_km: 30, extra_per_km: 20, waiting_per_minute: 1.5, waiting_grace_minutes: 3 },
    { service: "scooter_light", label: "Scooters & Light Bikes", tier: "economical", slab_km: 5, base_per_km: 30, extra_per_km: 15, waiting_per_minute: 1.5, waiting_grace_minutes: 3 },
  ]);

  const evQuote = quoteRideRequest({
    kind: "now",
    service: "ev_bike",
    routedKm: osrmKm,
    pickup,
    drop,
    rates: adminRates,
  });
  assert.deepEqual(evQuote, {
    distanceKm: 8.45,
    fare: distanceFare(8.45, "ev_bike", adminRates),
  });
  assert.equal(evQuote.fare, 219);

  const scooterQuote = quoteRideRequest({
    kind: "scheduled",
    service: "scooter_light",
    routedKm: osrmKm,
    pickup,
    drop,
    rates: adminRates,
  });
  assert.deepEqual(scooterQuote, {
    distanceKm: 8.45,
    fare: distanceFare(8.45, "scooter_light", adminRates),
  });
  assert.equal(scooterQuote.fare, 202);

  const fallbackQuote = quoteRideRequest({
    kind: "now",
    service: "ev_bike",
    routedKm: null,
    pickup,
    drop,
    rates: adminRates,
  });
  assert.deepEqual(fallbackQuote, {
    distanceKm: straightKm,
    fare: distanceFare(straightKm, "ev_bike", adminRates),
  });

  const hireQuote = quoteRideRequest({
    kind: "hire",
    service: "ev_bike",
    routedKm: osrmKm,
    pickup,
    drop,
    hireHours: 3,
    rates: adminRates,
  });
  assert.deepEqual(hireQuote, {
    distanceKm: null,
    fare: 750,
  });
});
