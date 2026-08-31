import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isMissingAuthUser(message: string, status?: number) {
  return status === 404 || /user not found/i.test(message);
}

export async function deleteMemberById(userId: string, actorId: string | null) {
  if (!UUID_PATTERN.test(userId)) return { error: "Invalid request." };
  if (actorId && actorId === userId) {
    return { error: "You cannot remove your own account." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Member removal is not configured on this server." };
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError && !isMissingAuthUser(authError.message, authError.status)) {
    return { error: authError.message };
  }

  const { data: leftover, error: leftoverError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (leftoverError) return { error: leftoverError.message };

  if (leftover) {
    const { data: removed, error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId)
      .select("id");
    if (profileError) return { error: profileError.message };
    if (!removed?.length) {
      return { error: "Could not remove this member." };
    }
  }

  return {};
}
