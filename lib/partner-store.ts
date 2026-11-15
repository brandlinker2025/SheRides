import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PartnerApplication } from "@/lib/partner-application";

/**
 * Partner applications are stored in Supabase when SUPABASE_SERVICE_ROLE_KEY is set.
 * The insert goes to public.partner_applications (see
 * supabase/migrations/20261115183000_partner_applications.sql). The service role
 * bypasses RLS; anonymous clients cannot read or write the table.
 *
 * If the service role is not configured, the same record is appended as one JSON
 * line in data/partner-applications.ndjson. That file is gitignored and is only
 * a local fallback so the form still works in development.
 */
const FALLBACK_FILE = path.join(process.cwd(), "data", "partner-applications.ndjson");

export type StoredPartnerApplication = {
  id: string;
  via: "supabase" | "file";
};

export async function storePartnerApplication(application: PartnerApplication): Promise<StoredPartnerApplication> {
  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin
      .from("partner_applications")
      .insert({
        full_name: application.fullName,
        phone: application.phone,
        area: application.area,
        vehicle_type: application.vehicleType,
        commitment: application.commitment,
        note: application.note,
      })
      .select("id")
      .single();
    if (error || !data?.id) {
      throw new Error(error?.message ?? "Partner application was not saved.");
    }
    return { id: String(data.id), via: "supabase" };
  }

  const id = crypto.randomUUID();
  await mkdir(path.dirname(FALLBACK_FILE), { recursive: true });
  await appendFile(
    FALLBACK_FILE,
    `${JSON.stringify({ id, ...application, createdAt: new Date().toISOString() })}\n`,
    "utf8",
  );
  return { id, via: "file" };
}
