import assert from "node:assert/strict";
import { test } from "node:test";
import { matchSaved } from "./go";

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
