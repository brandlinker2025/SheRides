import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applicationSavedPath,
  createSubmitLock,
  runGoApplicationSubmit,
  validateGoApplication,
  type GoApplicationDraft,
  type GoApplicationPayload,
} from "./go-application";

const jpeg = new File([Uint8Array.from([1, 2, 3])], "synthetic.jpg", { type: "image/jpeg" });

function draft(overrides: Partial<GoApplicationDraft> = {}): GoApplicationDraft {
  return {
    role: "passenger",
    userId: "synthetic-user",
    fullName: "Test Rider",
    nid: "1234567890",
    emergencyName: "Sister",
    emergencyPhone: "01700000000",
    hasNidFront: true,
    hasNidBack: false,
    hasSelfie: true,
    licenseNo: "",
    hasLicenseFile: false,
    bikeModel: "",
    bikePlate: "",
    hasBikePapers: false,
    declared: true,
    ...overrides,
  };
}

test("required fields and consent block a save before any upload", () => {
  assert.equal(validateGoApplication(draft({ userId: null })), "Sign in to submit your application.");
  assert.match(validateGoApplication(draft({ fullName: "A" })) ?? "", /full name/);
  assert.match(validateGoApplication(draft({ nid: "12" })) ?? "", /10 to 17/);
  assert.match(validateGoApplication(draft({ emergencyPhone: "123" })) ?? "", /mobile/);
  assert.match(validateGoApplication(draft({ hasSelfie: false })) ?? "", /selfie/);
  assert.match(validateGoApplication(draft({ declared: false })) ?? "", /declaration/);
  assert.match(
    validateGoApplication(draft({ role: "rider", licenseNo: "", hasLicenseFile: false })) ?? "",
    /licence/,
  );
});

test("a successful mock save is the only path that returns the confirmation route", async () => {
  const saved: GoApplicationPayload[] = [];
  const progress: string[] = [];
  const uploads: string[] = [];
  const result = await runGoApplicationSubmit({
    draft: draft(),
    files: { nidFront: jpeg, nidBack: null, selfie: jpeg, licenseFile: null, bikePapers: null },
    lock: createSubmitLock(),
    onProgress: (message) => progress.push(message),
    transport: {
      upload: async (slot) => {
        uploads.push(slot);
        return `synthetic-user/go/${slot}.jpg`;
      },
      save: async (payload) => {
        saved.push(payload);
      },
    },
  });

  assert.deepEqual(uploads, ["nid-front", "selfie"]);
  assert.equal(saved.length, 1);
  assert.equal(saved[0]?.p_declared_female, true);
  assert.equal(saved[0]?.p_nid_front_path, "synthetic-user/go/nid-front.jpg");
  assert.deepEqual(progress, ["Uploading NID…", "Uploading selfie…", "Sending for admin approval…"]);
  assert.deepEqual(result, { ok: true, href: applicationSavedPath("passenger") });
});

test("a failed mock save does not return a route, and a held lock blocks a second save", async () => {
  const lock = createSubmitLock();
  let saves = 0;
  const failed = await runGoApplicationSubmit({
    draft: draft({ role: "rider", licenseNo: "DH-1", hasLicenseFile: true, bikeModel: "Fascino", bikePlate: "HA-12-3456", hasBikePapers: true }),
    files: { nidFront: jpeg, nidBack: null, selfie: jpeg, licenseFile: jpeg, bikePapers: jpeg },
    lock,
    onProgress: () => {},
    transport: {
      upload: async (slot) => `synthetic-user/go/${slot}.jpg`,
      save: async () => {
        saves += 1;
        throw new Error("network down");
      },
    },
  });
  assert.equal(failed.ok, false);
  if (!failed.ok) {
    assert.equal("href" in failed, false);
    assert.equal(failed.duplicate, false);
    assert.match(failed.error ?? "", /network down/);
  }
  assert.equal(saves, 1);

  assert.equal(lock.tryBegin(), true);
  const blocked = await runGoApplicationSubmit({
    draft: draft(),
    files: { nidFront: jpeg, nidBack: null, selfie: jpeg, licenseFile: null, bikePapers: null },
    lock,
    onProgress: () => {},
    transport: {
      upload: async () => {
        throw new Error("should not upload");
      },
      save: async () => {
        saves += 1;
      },
    },
  });
  assert.deepEqual(blocked, { ok: false, duplicate: true, error: null });
  assert.equal(saves, 1);
});
