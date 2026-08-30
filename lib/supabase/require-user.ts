import { redirect } from "next/navigation";
import { createServerSupabase } from "./server";

export async function requireUser() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    redirect("/login");
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      redirect("/login");
    }

    return user;
  } catch {
    redirect("/login");
  }
}
