import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGate } from "@/components/auth/AuthGate";
import { requireStaff } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase, role } = await requireStaff();
  const [members, passengers, riders, partners] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verified", false).neq("role", "admin"),
    supabase.from("go_applications").select("id", { count: "exact", head: true }).eq("role", "passenger").eq("status", "pending"),
    supabase.from("go_applications").select("id", { count: "exact", head: true }).eq("role", "rider").eq("status", "pending"),
    supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const queueCount = (passengers.count ?? 0) + (riders.count ?? 0) + (partners.error ? 0 : partners.count ?? 0);
  return (
    <AdminGate>
      <AdminShell adminName={profile?.full_name} role={role} pendingCount={members.count ?? 0} queueCount={queueCount}>
        {children}
      </AdminShell>
    </AdminGate>
  );
}
