import assert from "node:assert/strict";
import { test } from "node:test";
import { matchSaved, sheRidesFare } from "./go";

const rows = [
  { name: "Yamaha Flagship Center", area: "Tejgaon", lat: 23.766, lng: 90.4 },
  { name: "ACI Centre", area: "Tejgaon Industrial Area", lat: 23.77, lng: 90.405 },
];

test("staff-pinned places match by word starts, in any case", () => {
  assert.equal(matchSaved(rows, "Yamaha Flagship Center tejgaon")[0]?.label, "Yamaha Flagship Center, Tejgaon");
  assert.equal(matchSaved(rows, "yam tej").length, 1);
  assert.equal(matchSaved(rows, "flagship").length, 1);
  assert.equal(matchSaved(rows, "tejgaon").length, 2);
  assert.equal(matchSaved(rows, "gulshan").length, 0);
});


test("fare chart: live ৳30/km, pre-book slabs, hire ৳300/h", () => {
  assert.equal(sheRidesFare("now", 4, null), 120);
  assert.equal(sheRidesFare("now", 0.4, null), 30);
  assert.equal(sheRidesFare("scheduled", 1.2, null), 100);
  assert.equal(sheRidesFare("scheduled", 2, null), 100);
  assert.equal(sheRidesFare("scheduled", 2.1, null), 120);
  assert.equal(sheRidesFare("scheduled", 4, null), 150);
  assert.equal(sheRidesFare("scheduled", 5.5, null), 210);
  assert.equal(sheRidesFare("scheduled", 8, null), 250);
  assert.equal(sheRidesFare("hire", null, 3), 900);
  assert.equal(sheRidesFare("now", null, null), null);
});
