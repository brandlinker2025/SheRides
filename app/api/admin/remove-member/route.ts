import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteMemberById } from "@/lib/admin/remove-member";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

function actorId(user: { id: string }, profile: { id: string } | null) {
  return profile?.id ?? (user.id !== "open-access" ? user.id : null);
}

export async function POST(request: Request) {
  let userId = "";
  try {
    const body = (await request.json()) as { userId?: unknown };
    userId = typeof body.userId === "string" ? body.userId : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const { user, profile } = await requireAdmin();
    const result = await deleteMemberById(userId, actorId(user, profile));
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/admin/verifications");
    revalidatePath("/home");
    revalidatePath("/pending-approval");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not remove this member.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
