import { redirect } from "next/navigation";
import { createServerSupabase } from "./server";

export async function requireUser() {
  const supabase = createServerSupabase();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
