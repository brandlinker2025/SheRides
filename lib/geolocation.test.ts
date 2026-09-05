import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isLocationPermissionDenied, locationErrorMessage } from "./geolocation";

test("Permissions-Policy allows same-origin geolocation and keeps camera blocked", () => {
  const config = readFileSync(new URL("../next.config.mjs", import.meta.url), "utf8");
  assert.match(config, /geolocation=\(self\)/);
  assert.match(config, /microphone=\(self\)/);
  assert.match(config, /camera=\(\)/);
  assert.doesNotMatch(config, /geolocation=\(\)[, ]/);
});

test("permission denied copy asks the user to tap Allow, not only the lock icon", () => {
  const message = locationErrorMessage({ code: 1 });
  assert.match(message, /Tap Allow/);
  assert.doesNotMatch(message, /lock icon/i);
  assert.equal(isLocationPermissionDenied({ code: 1 }), true);
  assert.equal(isLocationPermissionDenied({ code: 2 }), false);
});
