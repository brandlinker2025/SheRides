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
};

export type AdminPostRow = {
  id: string;
  content: string;
  image_url: string | null;
  location: string | null;
  created_at: string;
  likes_count: number;
  author: {
    id: string;
    full_name: string;
    username: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
};

export type AdminEventRow = {
  id: string;
  title: string;
  description: string | null;
  kind: "Ride" | "Workshop" | "Meetup" | "Tour";
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
  attending_count: number;
  featured: boolean;
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
    posts?: number | string | null;
    events?: number | string | null;
    signups_today?: number | string | null;
  } | null;
  const setupNeeded = missingTable(error);

  return {
    users: Number(row?.users ?? 0),
    verified: Number(row?.verified ?? 0),
    pendingApproval: Number(row?.pending_approval ?? 0),
    posts: Number(row?.posts ?? 0),
    events: Number(row?.events ?? 0),
    signupsToday: Number(row?.signups_today ?? 0),
    setupNeeded,
    error: setupNeeded
      ? "Database tables are not set up yet. Run supabase/schema.sql (or supabase/admin.sql) in the Supabase SQL editor."
      : error?.message ?? null,
  };
}

export async function loadAdminUsers(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("admin_list_members");
  return { users: (data ?? []) as AdminUserRow[], error: error?.message ?? null };
}

export async function loadAdminVerifications(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("verifications")
    .select("id, user_id, document_url, status, nid_number, driving_license_number, chassis_number, notes, created_at, profile:profiles!verifications_user_id_fkey(full_name, username, avatar_url)")
    .order("created_at", { ascending: false });

  if (error) return { verifications: [] as AdminVerificationRow[], error: error.message };

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
        document_signed_url: documentSignedUrl,
      } as AdminVerificationRow;
    })
  );

  return { verifications, error: null };
}

export async function loadAdminPosts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, content, image_url, location, created_at, likes_count, author:profiles!author_id(id, full_name, username, avatar_url, verified)"
    )
    .order("created_at", { ascending: false });

  const posts = (data ?? []).map((row) => {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    return { ...row, author: author ?? null } as AdminPostRow;
  });

  return { posts, error: error?.message ?? null };
}

export async function loadAdminEvents(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, kind, location, starts_at, ends_at, cover_url, attending_count, featured")
    .order("starts_at", { ascending: false });
  return { events: (data ?? []) as AdminEventRow[], error: error?.message ?? null };
}
