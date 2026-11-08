import { goErrorMessage, type GoRole } from "@/lib/go";

/** Fields the ride-application form already collects. Files stay on the device until upload. */
export type GoApplicationDraft = {
  role: GoRole;
  userId: string | null;
  fullName: string;
  nid: string;
  emergencyName: string;
  emergencyPhone: string;
  hasNidFront: boolean;
  hasNidBack: boolean;
  hasSelfie: boolean;
  licenseNo: string;
  hasLicenseFile: boolean;
  bikeModel: string;
  bikePlate: string;
  hasBikePapers: boolean;
  declared: boolean;
};

export type GoApplicationPayload = {
  p_role: GoRole;
  p_full_name: string;
  p_nid_number: string;
  p_emergency_name: string;
  p_emergency_phone: string;
  p_nid_front_path: string;
  p_nid_back_path: string | null;
  p_selfie_path: string;
  p_license_number: string | null;
  p_license_path: string | null;
  p_bike_model: string | null;
  p_bike_plate: string | null;
  p_bike_papers_path: string | null;
  p_declared_female: true;
};

export type GoApplicationTransport = {
  upload: (slot: "nid-front" | "nid-back" | "selfie" | "licence" | "bike-papers") => Promise<string>;
  save: (payload: GoApplicationPayload) => Promise<void>;
};

export type SubmitLock = {
  tryBegin: () => boolean;
  release: () => void;
};

export type SubmitResult =
  | { ok: true; href: string }
  | { ok: false; duplicate: boolean; error: string | null };

export function createSubmitLock(): SubmitLock {
  let held = false;
  return {
    tryBegin() {
      if (held) return false;
      held = true;
      return true;
    },
    release() {
      held = false;
    },
  };
}

export function applicationSavedPath(role: GoRole) {
  return `/go?submitted=${role}`;
}

/** Same checks the form already enforced, returned as one readable line. */
export function validateGoApplication(draft: GoApplicationDraft): string | null {
  if (!draft.userId) return "Sign in to submit your application.";
  if (draft.fullName.trim().length < 2) return "Write your full name as on your NID.";
  if (!/^\d{10,17}$/.test(draft.nid)) return "NID number must be 10 to 17 digits.";
  if (!draft.emergencyName.trim() || !/^(\+?88)?01[3-9]\d{8}$/.test(draft.emergencyPhone.trim())) {
    return "Add an emergency contact with a valid Bangladesh mobile number.";
  }
  if (!draft.hasNidFront || !draft.hasSelfie) return "Step 1 live selfie and Step 2 NID front photo are both required.";
  if (
    draft.role === "rider" &&
    (!draft.licenseNo.trim() || !draft.hasLicenseFile || !draft.bikeModel.trim() || !draft.bikePlate.trim() || !draft.hasBikePapers)
  ) {
    return "Riders must add licence number + photo, bike model, number plate and bike papers.";
  }
  if (!draft.declared) return "Please confirm the declaration.";
  return null;
}

/**
 * Uploads the documents, then saves through the existing member RPC.
 * Resolves only after that save succeeds. A thrown save leaves the caller on the form.
 */
export async function runGoApplicationSubmit(options: {
  draft: GoApplicationDraft;
  files: {
    nidFront: File | null;
    nidBack: File | null;
    selfie: File | null;
    licenseFile: File | null;
    bikePapers: File | null;
  };
  lock: SubmitLock;
  transport: GoApplicationTransport;
  onProgress: (message: string) => void;
}): Promise<SubmitResult> {
  if (!options.lock.tryBegin()) return { ok: false, duplicate: true, error: null };

  let saved = false;
  try {
    const problem = validateGoApplication(options.draft);
    if (problem) return { ok: false, duplicate: false, error: problem };

    options.onProgress("Uploading NID…");
    const nidFrontPath = await options.transport.upload("nid-front");
    const nidBackPath = options.files.nidBack ? await options.transport.upload("nid-back") : null;
    options.onProgress("Uploading selfie…");
    const selfiePath = await options.transport.upload("selfie");

    let licensePath: string | null = null;
    let papersPath: string | null = null;
    if (options.draft.role === "rider") {
      options.onProgress("Uploading licence and bike papers…");
      licensePath = await options.transport.upload("licence");
      papersPath = await options.transport.upload("bike-papers");
    }

    options.onProgress("Sending for admin approval…");
    await options.transport.save({
      p_role: options.draft.role,
      p_full_name: options.draft.fullName.trim(),
      p_nid_number: options.draft.nid,
      p_emergency_name: options.draft.emergencyName.trim(),
      p_emergency_phone: options.draft.emergencyPhone.trim(),
      p_nid_front_path: nidFrontPath,
      p_nid_back_path: nidBackPath,
      p_selfie_path: selfiePath,
      p_license_number: options.draft.role === "rider" ? options.draft.licenseNo.trim() : null,
      p_license_path: licensePath,
      p_bike_model: options.draft.role === "rider" ? options.draft.bikeModel.trim() : null,
      p_bike_plate: options.draft.role === "rider" ? options.draft.bikePlate.trim() : null,
      p_bike_papers_path: papersPath,
      p_declared_female: true,
    });
    saved = true;
    return { ok: true, href: applicationSavedPath(options.draft.role) };
  } catch (error) {
    return { ok: false, duplicate: false, error: goErrorMessage(error) };
  } finally {
    if (!saved) options.lock.release();
  }
}
