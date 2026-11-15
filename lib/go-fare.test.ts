import assert from "node:assert/strict";
import { test } from "node:test";
import { FARE_RATES, distanceFare, estimateServiceFare, formatTaka, ratesFromCatalog, waitingFee } from "./go";

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

test("waiting is 1.50 per minute and stays off the distance fare", () => {
  assert.equal(waitingFee(1, "ev_bike"), 1.5);
  assert.equal(waitingFee(1, "scooter_light"), 1.5);
  assert.equal(formatTaka(waitingFee(1)), "৳1.50");
  assert.equal(FARE_RATES.every((rate) => rate.waitingPerMinute === 1.5), true);
  const catalog = JSON.stringify(FARE_RATES).toLowerCase();
  assert.equal(catalog.includes("cng"), false);
  assert.equal(catalog.includes("\"car\""), false);
});
