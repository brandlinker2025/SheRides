import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RIDE_SERVICES,
  WAITING_FEE_PER_MINUTE,
  distanceFare,
  estimateFare,
  estimateServiceFare,
  formatTaka,
  waitingFee,
} from "./go";

test("5 km is exactly 150 BDT at 30 per km", () => {
  assert.equal(distanceFare(5), 150);
  assert.equal(estimateFare("now", 5, null), 150);
  assert.equal(distanceFare(4), 120);
  assert.equal(distanceFare(1), 30);
});

test("distance beyond 5 km is 18 BDT per km", () => {
  assert.equal(distanceFare(8), 204);
  assert.equal(distanceFare(6), 168);
  assert.equal(distanceFare(5.5), 159);
  assert.equal(estimateFare("scheduled", 8, null), 204);
});

test("every vehicle uses the same slab and there is no car tier", () => {
  const ids = RIDE_SERVICES.map((item) => item.id);
  assert.deepEqual(ids, ["ev_bike", "racing_bike", "moto_155", "scooter_light"]);
  for (const service of ids) {
    assert.equal(estimateServiceFare(service, "now", 5, null), 150);
    assert.equal(estimateServiceFare(service, "now", 8, null), 204);
  }
  assert.equal(JSON.stringify(RIDE_SERVICES).includes("car"), false);
  assert.equal(JSON.stringify(RIDE_SERVICES).toLowerCase().includes("cng"), false);
});

test("waiting is 1.50 BDT per minute and stays separate from distance", () => {
  assert.equal(WAITING_FEE_PER_MINUTE, 1.5);
  assert.equal(waitingFee(1), 1.5);
  assert.equal(waitingFee(10), 15);
  assert.equal(formatTaka(waitingFee(1)), "৳1.50");
  assert.equal(formatTaka(distanceFare(5)), "৳150");
  assert.equal(distanceFare(5) + waitingFee(0), 150);
});
