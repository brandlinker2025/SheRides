import { NextResponse } from "next/server";
import { sha256Hex } from "@/lib/admin/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_FAILS = 8;

/** Short link + PIN sign-in for admins and moderators. Signs in this browser and keeps the session. */
export async function POST(request: Request) {
  let slug = "";
  let pin = "";
  try {
    const body = (await request.json()) as { slug?: unknown; pin?: unknown };
    slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    pin = typeof body.pin === "string" ? body.pin.replace(/\D/g, "") : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!/^[a-z0-9-]{3,30}$/.test(slug) || !/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "৬ সংখ্যার PIN দিন।" }, { status: 400 });
  }
  const admin = createAdminClient();
  const session = await createServerSupabase();
  if (!admin || !session) return NextResponse.json({ error: "Login is not configured on the server." }, { status: 500 });

  const { data: row } = await admin
    .from("staff_access_links")
    .select("id, user_id, token_hash, fail_count")
    .eq("kind", "pin")
    .eq("slug", slug)
    .is("revoked_at", null)
    .maybeSingle();
  // Same answer for an unknown link and a wrong PIN.
  await new Promise((r) => setTimeout(r, 600));
  if (!row) return NextResponse.json({ error: "PIN মিলছে না।" }, { status: 401 });
  if (row.fail_count >= MAX_FAILS) {
    return NextResponse.json({ error: "অনেকবার ভুল PIN দেওয়া হয়েছে, তাই এটা বন্ধ। Main admin-এর কাছে নতুন PIN চান।" }, { status: 423 });
  }
  if ((await sha256Hex(`pin:${slug}:${pin}`)) !== row.token_hash) {
    await admin.from("staff_access_links").update({ fail_count: row.fail_count + 1 }).eq("id", row.id);
    const left = MAX_FAILS - row.fail_count - 1;
    return NextResponse.json({ error: left > 0 ? `PIN মিলছে না। আর ${left} বার চেষ্টা করা যাবে।` : "PIN বন্ধ হয়ে গেছে। Main admin-এর কাছে নতুন PIN চান।" }, { status: 401 });
  }

  const { data: profile } = await admin.from("profiles").select("role").eq("id", row.user_id).maybeSingle();
  if (profile?.role !== "admin" && profile?.role !== "moderator") return NextResponse.json({ error: "PIN মিলছে না।" }, { status: 401 });
  const { data: user } = await admin.auth.admin.getUserById(row.user_id);
  const email = user.user?.email;
  if (!email) return NextResponse.json({ error: "Account problem. Ask the main admin." }, { status: 500 });

  const generated = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = generated.data?.properties?.hashed_token;
  if (generated.error || !tokenHash) return NextResponse.json({ error: "Login could not start. Try again." }, { status: 500 });
  const { error } = await session.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (error) return NextResponse.json({ error: "Login could not start. Try again." }, { status: 500 });

  await admin.from("staff_access_links").update({ fail_count: 0, last_used_at: new Date().toISOString() }).eq("id", row.id);
  return NextResponse.json({ ok: true, next: profile.role === "admin" ? "/admin" : "/admin/go" });
}
