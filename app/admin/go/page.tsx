import { GoAdminBoard, type AdminGoApplication, type AdminGoRide } from "@/components/admin/GoAdminBoard";
import { BackLink } from "@/components/ui/BackLink";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DOC_FIELDS = ["nid_front_path", "nid_back_path", "selfie_path", "license_path", "bike_papers_path"] as const;
const DOC_LABEL: Record<(typeof DOC_FIELDS)[number], string> = {
  nid_front_path: "NID front",
  nid_back_path: "NID back",
  selfie_path: "Live selfie",
  license_path: "Licence",
  bike_papers_path: "Bike papers",
};

export default async function AdminGoPage() {
  const { supabase } = await requireAdmin();

  const [{ data: appRows, error: appError }, { data: rideRows, error: rideError }] = await Promise.all([
    supabase
      .from("go_applications")
      .select("*, profile:profiles!go_applications_user_id_fkey(full_name, username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("go_rides")
      .select(
        "id, rider_id, kind, status, pickup_text, drop_text, fare, completed_at, scheduled_at, created_at, rider_rating, rider_feedback, passenger_rating, passenger_feedback, passenger:profiles!go_rides_passenger_id_fkey(full_name), rider:profiles!go_rides_rider_id_fkey(full_name)"
      )
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const applications: AdminGoApplication[] = await Promise.all(
    (appRows ?? []).map(async (row: Record<string, unknown>) => {
      const docs: { label: string; url: string }[] = [];
      for (const field of DOC_FIELDS) {
        const path = row[field] as string | null;
        if (!path) continue;
        const signed = await supabase.storage.from("verifications").createSignedUrl(path, 600);
        if (signed.data?.signedUrl) docs.push({ label: DOC_LABEL[field], url: signed.data.signedUrl });
      }
      const profile = (Array.isArray(row.profile) ? row.profile[0] : row.profile) as
        | { full_name: string; username: string; avatar_url: string | null }
        | null;
      return {
        id: row.id as string,
        user_id: row.user_id as string,
        role: row.role as "passenger" | "rider",
        status: row.status as AdminGoApplication["status"],
        full_name: row.full_name as string,
        nid_number: row.nid_number as string,
        emergency_contact_name: (row.emergency_contact_name as string | null) ?? null,
        emergency_contact_phone: (row.emergency_contact_phone as string | null) ?? null,
        license_number: (row.license_number as string | null) ?? null,
        bike_model: (row.bike_model as string | null) ?? null,
        bike_plate: (row.bike_plate as string | null) ?? null,
        admin_notes: (row.admin_notes as string | null) ?? null,
        created_at: row.created_at as string,
        profile,
        docs,
      };
    })
  );

  const rides = (rideRows ?? []).map((row: Record<string, unknown>) => {
    const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as { full_name: string } | null;
    return { ...row, passenger: one(row.passenger), rider: one(row.rider) } as AdminGoRide;
  });

  const setupMissing = Boolean(appError || rideError);

  return (
    <div>
      <BackLink href="/admin" label="Dashboard" className="mb-3" />
      <h1 className="font-headline-xl text-headline-xl mb-2">Riders</h1>
      <p className="font-body-lg text-secondary mb-8">
        Every registered rider: NID and selfie check, licence, bike, approval status and ride history. Approve only when the selfie clearly matches the NID and the person is a woman.
      </p>
      {setupMissing ? (
        <p className="card-surface p-6 font-body-sm text-error">
          Ride booking database tables are not installed yet. Run the ride booking SQL in Supabase first.
          {appError ? ` (${appError.message})` : ""}
        </p>
      ) : (
        <GoAdminBoard applications={applications} rides={rides} />
      )}
    </div>
  );
}
