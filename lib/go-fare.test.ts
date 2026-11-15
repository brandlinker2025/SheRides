import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateFare, estimateServiceFare, estimateTripMinutes } from "./go";

test("bike service fare matches the database baseline", () => {
  assert.equal(estimateServiceFare("bike", "now", 5.5, null), estimateFare("now", 5.5, null));
  assert.equal(estimateServiceFare("bike", "now", 0, null), 70);
  assert.equal(estimateServiceFare("bike", "hire", null, 2), 500);
});

test("scooter and car estimates sit above the bike fare", () => {
  const bike = estimateServiceFare("bike", "now", 8, null);
  const scooter = estimateServiceFare("scooter", "now", 8, null);
  const car = estimateServiceFare("car", "now", 8, null);
  assert.ok(scooter > bike);
  assert.ok(car > scooter);
  assert.equal(car, Math.max(180, Math.round((30 + 14 * 8) * 1.85)));
});

test("trip minutes need a destination", () => {
  assert.equal(estimateTripMinutes("bike", null), null);
  assert.ok((estimateTripMinutes("car", 10) ?? 0) >= 4);
});
