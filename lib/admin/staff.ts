import type { SupabaseClient } from "@supabase/supabase-js";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Finds an auth user by email with the service-role client (small member base: a few pages at most). */
export async function findAuthUserByEmail(admin: SupabaseClient, email: string) {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 1000) return null;
  }
  return null;
}

export async function listStaff(admin: SupabaseClient) {
  const { data: rows } = await admin.from("profiles").select("id, full_name, role").in("role", ["admin", "moderator"]);
  const staff = rows ?? [];
  const emails = new Map<string, string>();
  for (const row of staff) {
    const { data } = await admin.auth.admin.getUserById(row.id);
    if (data.user?.email) emails.set(row.id, data.user.email);
  }
  return staff.map((row) => ({
    id: row.id as string,
    name: (row.full_name as string | null) ?? "",
    role: row.role as "admin" | "moderator",
    email: emails.get(row.id) ?? "",
  }));
}

export async function sha256Hex(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newStaffToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Buffer.from(bytes).toString("base64url");
}

export const STAFF_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;
