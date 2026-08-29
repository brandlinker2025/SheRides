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

function missingTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST205" || /could not find the table|schema cache/i.test(error.message ?? "");
}

export async function loadAdminStats(supabase: SupabaseClient) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [users, verified, posts, events, signupsToday] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", true),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
  ]);

  const setupNeeded = [users, posts, events].some((r) => missingTable(r.error));

  return {
    users: users.count ?? 0,
    verified: verified.count ?? 0,
    posts: posts.count ?? 0,
    events: events.count ?? 0,
    signupsToday: signupsToday.count ?? 0,
    setupNeeded,
    error: setupNeeded
      ? "Database tables are not set up yet. Run supabase/schema.sql (or supabase/admin.sql) in the Supabase SQL editor."
      : users.error?.message ?? posts.error?.message ?? events.error?.message ?? null,
  };
}

export async function loadAdminUsers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, location, bike, avatar_url, verified, role, created_at")
    .order("created_at", { ascending: true });
  return { users: (data ?? []) as AdminUserRow[], error: error?.message ?? null };
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
