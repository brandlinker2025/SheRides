import { NextResponse, type NextRequest } from "next/server";
import { STAFF_TOKEN_PATTERN, sha256Hex } from "@/lib/admin/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Private staff login link: sherides.online/staff/<secret>.
 * Signs the admin or moderator in on this device (session cookie ~13 months) and opens her panel.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/admin-login?link=${reason}`, request.url));

  if (!STAFF_TOKEN_PATTERN.test(token)) return fail("invalid");
  const admin = createAdminClient();
  const session = await createServerSupabase();
  if (!admin || !session) return fail("setup");

  const hash = await sha256Hex(token);
  const { data: link } = await admin
    .from("staff_access_links")
    .select("id, user_id, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();
  if (!link || link.revoked_at) return fail("invalid");

  const { data: profile } = await admin.from("profiles").select("role").eq("id", link.user_id).maybeSingle();
  if (profile?.role !== "admin" && profile?.role !== "moderator") return fail("invalid");

  const { data: user } = await admin.auth.admin.getUserById(link.user_id);
  const email = user.user?.email;
  if (!email) return fail("invalid");

  // Mint a one-time sign-in token server-side (no email is sent) and redeem it into this browser's cookies.
  const generated = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = generated.data?.properties?.hashed_token;
  if (generated.error || !tokenHash) return fail("setup");
  const { error } = await session.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (error) return fail("setup");

  await admin.from("staff_access_links").update({ last_used_at: new Date().toISOString() }).eq("id", link.id);
  return NextResponse.redirect(new URL(profile.role === "admin" ? "/admin" : "/admin/go", request.url));
}
