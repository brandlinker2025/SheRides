import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGate } from "@/components/auth/AuthGate";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return (
    <AdminGate>
      <AdminShell adminName={profile?.full_name}>{children}</AdminShell>
    </AdminGate>
  );
}
