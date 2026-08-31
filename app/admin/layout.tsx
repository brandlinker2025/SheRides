import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGate } from "@/components/auth/AuthGate";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireAdmin();
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("verified", false)
    .neq("role", "admin");
  return (
    <AdminGate>
      <AdminShell adminName={profile?.full_name} pendingCount={count ?? 0}>
        {children}
      </AdminShell>
    </AdminGate>
  );
}
