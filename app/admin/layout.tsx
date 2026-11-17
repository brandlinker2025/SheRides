import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase, role } = await requireStaff();
  const [members, riders, partners] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verified", false).not("role", "in", "(admin,moderator)"),
    supabase.from("go_applications").select("id", { count: "exact", head: true }).eq("role", "rider").eq("status", "pending"),
    supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const queueCount = (riders.count ?? 0) + (partners.error ? 0 : partners.count ?? 0);
  return (
    <AdminShell adminName={profile?.full_name} role={role} pendingCount={members.count ?? 0} queueCount={queueCount}>
      {children}
    </AdminShell>
  );
}
