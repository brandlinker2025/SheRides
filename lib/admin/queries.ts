import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminUserRow = {
  id: string;
  username: string | null;
  full_name: string;
  location: string | null;
  bike: string | null;
  avatar_url: string | null;
  verified: boolean;
  role: string;
  created_at: string;
  date_of_birth: string | null;
};

export type AdminVerificationRow = {
  id: string;
  user_id: string;
  document_url: string | null;
  status: "pending" | "approved" | "rejected";
  nid_number: string;
  driving_license_number: string | null;
  chassis_number: string | null;
  notes: string | null;
  created_at: string;
  profile: {
    full_name: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
  date_of_birth: string | null;
  document_signed_url: string | null;
};

function missingTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST205" || /could not find the table|schema cache/i.test(error.message ?? "");
}

export async function loadAdminStats(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("admin_dashboard_counts");
  const row = (Array.isArray(data) ? data[0] : data) as {
    users?: number | string | null;
    verified?: number | string | null;
    pending_approval?: number | string | null;
    signups_today?: number | string | null;
  } | null;
  const setupNeeded = missingTable(error);

  return {
    users: Number(row?.users ?? 0),
    verified: Number(row?.verified ?? 0),
    pendingApproval: Number(row?.pending_approval ?? 0),
    signupsToday: Number(row?.signups_today ?? 0),
    setupNeeded,
    error: setupNeeded
      ? "Database tables are not set up yet. Run supabase/schema.sql (or supabase/admin.sql) in the Supabase SQL editor."
      : error?.message ?? null,
  };
}

export async function loadAdminUsers(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("admin_list_members");
  if (error) return { users: [] as AdminUserRow[], error: error.message };

  const rows = (data ?? []) as Omit<AdminUserRow, "date_of_birth">[];
  const ids = rows.map((row) => row.id);
  const birthdays = new Map<string, string>();
  if (ids.length) {
    const { data: dobRows } = await supabase.from("member_birthdays").select("user_id, date_of_birth").in("user_id", ids);
    for (const row of dobRows ?? []) {
      birthdays.set(row.user_id as string, String(row.date_of_birth));
    }
  }

  return {
    users: rows.map((row) => ({
      ...row,
      date_of_birth: birthdays.get(row.id) ?? null,
    })),
    error: null,
  };
}

export async function loadAdminVerifications(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("verifications")
    .select("id, user_id, document_url, status, nid_number, driving_license_number, chassis_number, notes, created_at, profile:profiles!verifications_user_id_fkey(full_name, username, avatar_url)")
    .order("created_at", { ascending: false });

  if (error) return { verifications: [] as AdminVerificationRow[], error: error.message };

  const ids = [...new Set((data ?? []).map((row) => row.user_id as string))];
  const birthdays = new Map<string, string>();
  if (ids.length) {
    const { data: dobRows } = await supabase.from("member_birthdays").select("user_id, date_of_birth").in("user_id", ids);
    for (const row of dobRows ?? []) {
      birthdays.set(row.user_id as string, String(row.date_of_birth));
    }
  }

  const verifications = await Promise.all(
    (data ?? []).map(async (row) => {
      const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
      let documentSignedUrl: string | null = null;
      if (row.document_url) {
        const signed = await supabase.storage.from("verifications").createSignedUrl(row.document_url, 300);
        documentSignedUrl = signed.data?.signedUrl ?? null;
      }
      return {
        ...row,
        profile: profile ?? null,
        date_of_birth: birthdays.get(row.user_id as string) ?? null,
        document_signed_url: documentSignedUrl,
      } as AdminVerificationRow;
    })
  );

  return { verifications, error: null };
}
