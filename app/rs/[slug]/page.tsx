import { redirect } from "next/navigation";
import { StaffPinLogin } from "@/components/auth/StaffPinLogin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Staff short link (e.g. sherides.online/rs/brandlinker). Signed-in staff go straight in; others enter their PIN once. */
export default async function StaffShortLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await createServerSupabase();
  const { data } = session ? await session.auth.getUser() : { data: { user: null } };
  if (data.user) {
    const admin = createAdminClient() ?? session;
    const { data: profile } = admin ? await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle() : { data: null };
    if (profile?.role === "admin") redirect("/admin");
    if (profile?.role === "moderator") redirect("/admin/go");
  }
  return <StaffPinLogin slug={slug.toLowerCase()} />;
}
