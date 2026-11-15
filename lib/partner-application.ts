import { normalizeBdPhone } from "@/lib/phone";

/** Public recruitment lead. No NID, licence image, password, or payment data. */
export const VEHICLE_TYPES = ["car", "bike_scooter", "none"] as const;
export const COMMITMENTS = ["part_time", "full_time"] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];
export type Commitment = (typeof COMMITMENTS)[number];

export type PartnerApplication = {
  fullName: string;
  phone: string;
  area: string;
  vehicleType: VehicleType;
  commitment: Commitment;
  note: string | null;
};

export type PartnerField = "name" | "phone" | "area" | "vehicle" | "commitment" | "note" | "forbidden";

export type PartnerValidation =
  | { ok: true; value: PartnerApplication }
  | { ok: false; field: PartnerField };

const FORBIDDEN = new Set([
  "nid",
  "nidnumber",
  "nationalid",
  "license",
  "licence",
  "licenseimage",
  "licenceimage",
  "password",
  "pin",
  "payment",
  "card",
  "cvv",
  "bkash",
  "nagad",
  "selfie",
]);

function forbiddenKey(key: string) {
  return FORBIDDEN.has(key.toLowerCase().replace(/[^a-z]/g, ""));
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, "").trim() : "";
}

export function validatePartnerApplication(input: unknown): PartnerValidation {
  if (!input || typeof input !== "object") return { ok: false, field: "name" };
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some(forbiddenKey)) return { ok: false, field: "forbidden" };

  const fullName = cleanText(body.fullName);
  if (fullName.length < 2 || fullName.length > 80) return { ok: false, field: "name" };

  const phone = normalizeBdPhone(cleanText(body.phone));
  if (!phone || !/^8801[3-9]\d{8}$/.test(phone)) return { ok: false, field: "phone" };

  const area = cleanText(body.area);
  if (area.length < 2 || area.length > 80) return { ok: false, field: "area" };

  const vehicleType = body.vehicleType;
  if (vehicleType !== "car" && vehicleType !== "bike_scooter" && vehicleType !== "none") {
    return { ok: false, field: "vehicle" };
  }

  const commitment = body.commitment;
  if (commitment !== "part_time" && commitment !== "full_time") {
    return { ok: false, field: "commitment" };
  }

  const noteText = cleanText(body.note);
  if (noteText.length > 500) return { ok: false, field: "note" };

  return {
    ok: true,
    value: {
      fullName,
      phone,
      area,
      vehicleType,
      commitment,
      note: noteText.length ? noteText : null,
    },
  };
}
