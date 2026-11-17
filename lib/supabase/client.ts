import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "./config";

export { isSupabaseConfigured };

export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Members sign up once on their phone and stay signed in: keep the session cookie ~13 months.
    { cookieOptions: { maxAge: 60 * 60 * 24 * 400, sameSite: "lax", secure: typeof window === "undefined" || window.location.protocol === "https:", path: "/" } }
  );
}
