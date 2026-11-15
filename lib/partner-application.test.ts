import assert from "node:assert/strict";
import { test } from "node:test";
import { validatePartnerApplication } from "./partner-application";

const valid = {
  fullName: "ফাতেমা আক্তার",
  phone: "01712345678",
  area: "ধানমন্ডি, ঢাকা",
  vehicleType: "car",
  commitment: "part_time",
  note: "সন্ধ্যায় সময় দিতে পারি",
};

test("a complete lead is accepted and the phone is stored in 880 form", () => {
  const result = validatePartnerApplication(valid);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.phone, "8801712345678");
  assert.equal(result.value.note, "সন্ধ্যায় সময় দিতে পারি");
  assert.equal(result.value.vehicleType, "car");
});

test("empty note is stored as null and +880 phones are accepted", () => {
  const result = validatePartnerApplication({ ...valid, phone: "+8801812345678", note: "  " });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.phone, "8801812345678");
  assert.equal(result.value.note, null);
});

test("identity, licence, password, and payment fields are refused", () => {
  for (const extra of [{ nid: "1234567890" }, { license: "x" }, { password: "secret" }, { payment: "bkash" }]) {
    const result = validatePartnerApplication({ ...valid, ...extra });
    assert.equal(result.ok, false);
    if (result.ok) continue;
    assert.equal(result.field, "forbidden");
  }
});

test("short names, bad phones, and missing choices are rejected", () => {
  assert.equal(validatePartnerApplication({ ...valid, fullName: "A" }).ok, false);
  assert.equal(validatePartnerApplication({ ...valid, phone: "12345" }).ok, false);
  assert.equal(validatePartnerApplication({ ...valid, vehicleType: "cng" }).ok, false);
  assert.equal(validatePartnerApplication({ ...valid, commitment: "" }).ok, false);
  assert.equal(validatePartnerApplication({ ...valid, area: "D" }).ok, false);
  const longNote = validatePartnerApplication({ ...valid, note: "ন".repeat(501) });
  assert.equal(longNote.ok, false);
  if (!longNote.ok) assert.equal(longNote.field, "note");
});
