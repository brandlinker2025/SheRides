import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_ATTEMPTS, timingSafeEqual, type OtpPurpose } from "@/lib/otp";

/**
 * Server-side OTP bookkeeping in `public.phone_otps` (service role only).
 *
 * The signed cookie alone cannot enforce limits: a client can replay an older cookie
 * (attempts = 0) or drop it to skip the resend wait. These checks live in the database
 * so they hold no matter what cookie is sent.
 */

const RESEND_WAIT_MS = 60_000;
const MAX_SENDS_PER_HOUR = 5;

export type OtpCheck = "ok" | "invalid" | "locked";

/** Milliseconds the caller must wait before another SMS to this number, or 0. */
export async function serverResendWaitMs(admin: SupabaseClient, phone: string): Promise<number> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("phone_otps")
    .select("created_at")
    .eq("phone", phone)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: false })
    .limit(MAX_SENDS_PER_HOUR);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return 0;
  const sinceLast = Date.now() - new Date(rows[0].created_at as string).getTime();
  if (sinceLast < RESEND_WAIT_MS) return RESEND_WAIT_MS - sinceLast;
  if (rows.length >= MAX_SENDS_PER_HOUR) {
    const oldest = new Date(rows[rows.length - 1].created_at as string).getTime();
    return Math.max(RESEND_WAIT_MS, oldest + 60 * 60 * 1000 - Date.now());
  }
  return 0;
}

/** Retire any open code for this number/purpose and store the new one. */
export async function storeServerOtp(
  admin: SupabaseClient,
  phone: string,
  purpose: OtpPurpose,
  codeHash: string,
  expiresAt: Date
): Promise<void> {
  // Mark (not delete) old codes so the send history still counts toward rate limits.
  await admin
    .from("phone_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("phone", phone)
    .eq("purpose", purpose)
    .is("consumed_at", null);
  const { error } = await admin.from("phone_otps").insert({
    phone,
    purpose,
    code_hash: codeHash,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw error;
}

/**
 * Check a code against the newest open row. An attempt slot is claimed *before* the
 * comparison with a compare-and-set on `attempts`, so parallel guesses cannot exceed
 * MAX_ATTEMPTS. A correct code consumes the row so it cannot be reused.
 */
export async function checkServerOtp(
  admin: SupabaseClient,
  phone: string,
  purpose: OtpPurpose,
  codeHash: string
): Promise<OtpCheck> {
  const { data: row, error } = await admin
    .from("phone_otps")
    .select("id, code_hash, attempts, expires_at")
    .eq("phone", phone)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !row) return "invalid";
  if (new Date(row.expires_at as string).getTime() < Date.now()) return "invalid";
  const attempts = Number(row.attempts) || 0;
  if (attempts >= MAX_ATTEMPTS) return "locked";

  const { data: claimed } = await admin
    .from("phone_otps")
    .update({ attempts: attempts + 1 })
    .eq("id", row.id)
    .eq("attempts", attempts)
    .is("consumed_at", null)
    .select("id");
  if (!claimed?.length) return "invalid"; // lost a race with another guess; try again

  if (!timingSafeEqual(codeHash, row.code_hash as string)) {
    return attempts + 1 >= MAX_ATTEMPTS ? "locked" : "invalid";
  }

  const { data: consumed } = await admin
    .from("phone_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("consumed_at", null)
    .select("id");
  return consumed?.length ? "ok" : "invalid";
}
