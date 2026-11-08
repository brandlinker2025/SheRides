import assert from "node:assert/strict";
import test from "node:test";
import { hasPlatformOwnerClaim, isAdminProfileRole } from "./admin-access";

test("profile role allows only the exact admin value", () => {
  assert.equal(isAdminProfileRole("admin"), true);
  assert.equal(isAdminProfileRole("rider"), false);
  assert.equal(isAdminProfileRole("Admin"), false);
  assert.equal(isAdminProfileRole(null), false);
  assert.equal(isAdminProfileRole(undefined), false);
  assert.equal(isAdminProfileRole(""), false);
});

test("platform owner claim is only a boolean true in app_metadata", () => {
  assert.equal(hasPlatformOwnerClaim({ platform_owner: true }), true);
  assert.equal(hasPlatformOwnerClaim({ platform_owner: false }), false);
  assert.equal(hasPlatformOwnerClaim({ platform_owner: "true" }), false);
  assert.equal(hasPlatformOwnerClaim({ role: "admin" }), false);
  assert.equal(hasPlatformOwnerClaim({ full_name: "Razia Sultana Lina" }), false);
  assert.equal(hasPlatformOwnerClaim(null), false);
  assert.equal(hasPlatformOwnerClaim(undefined), false);
  assert.equal(hasPlatformOwnerClaim([]), false);
});
