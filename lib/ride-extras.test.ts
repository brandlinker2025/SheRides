import assert from "node:assert/strict";
import { test } from "node:test";
import { fareFloor, normalizePromoCode, quotePromo, summarizeEarnings } from "./ride-extras";

test("promo codes are cleaned the same way the database function cleans them", () => {
  assert.equal(normalizePromoCode(" she-welcome "), "SHEWELCOME");
  assert.equal(normalizePromoCode("৳10 off!!"), "10OFF");
});

test("a percent code never drops a ride below the existing minimum", () => {
  assert.deepEqual(quotePromo("percent", 10, 200, fareFloor("now")), { discount: 20, fare: 180 });
  assert.equal(quotePromo("percent", 30, 70, fareFloor("now")), null);
  assert.deepEqual(quotePromo("flat", 100, 400, fareFloor("hire")), { discount: 100, fare: 300 });
  assert.equal(quotePromo("flat", 100, 250, fareFloor("hire")), null);
});

test("earnings count only completed rides, in Dhaka time", () => {
  const now = new Date("2026-11-15T12:00:00.000Z");
  const summary = summarizeEarnings(
    [
      { status: "completed", fare: 150, completed_at: "2026-11-15T04:00:00.000Z" },
      { status: "completed", fare: 80, completed_at: "2026-11-10T12:00:00.000Z" },
      { status: "completed", fare: 90, completed_at: "2026-10-01T12:00:00.000Z" },
      { status: "cancelled", fare: 500, completed_at: "2026-11-15T04:00:00.000Z" },
      { status: "requested", fare: 70, completed_at: null },
    ],
    now,
  );
  assert.deepEqual(summary, { today: 150, week: 230, total: 320, completed: 3 });
});
