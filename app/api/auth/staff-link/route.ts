import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { EMAIL_PATTERN, findAuthUserByEmail } from "@/lib/admin/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const SENT = "If this email has SheRides admin or moderator access, a login link is on its way. Check the inbox (and Spam).";

// Light per-instance throttle on top of Supabase's own email limits.
const recent = new Map<string, number>();

/**
 * Staff (admin / moderator) sign in with an emailed one-time link — no password.
 * The link is only sent to emails that already have a staff role; the reply never says which.
 */
export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const last = recent.get(email) ?? 0;
  if (Date.now() - last < 60_000) {
    return NextResponse.json({ error: "A link was just sent. Wait a minute before asking again." }, { status: 429 });
  }
  recent.set(email, Date.now());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = createAdminClient();
  if (!url || !anon || !admin) return NextResponse.json({ error: "Login is not configured on the server." }, { status: 500 });

  try {
    const user = await findAuthUserByEmail(admin, email);
    if (!user) return NextResponse.json({ ok: SENT });
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin" && profile?.role !== "moderator") return NextResponse.json({ ok: SENT });

    // Implicit flow: the link carries the session itself, so it works in any browser or phone.
    const mailer = createClient(url, anon, { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } });
    const { error } = await mailer.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}/auth/callback?next=staff` },
    });
    if (error) {
      const text = /rate|limit|seconds/i.test(error.message)
        ? "Too many login emails right now. Wait a few minutes and try again."
        : error.message;
      return NextResponse.json({ error: text }, { status: 429 });
    }
    return NextResponse.json({ ok: SENT });
  } catch {
    return NextResponse.json({ error: "Could not send the login link. Try again." }, { status: 500 });
  }
}
