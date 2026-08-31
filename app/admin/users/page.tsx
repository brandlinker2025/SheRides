import { UsersTable } from "@/components/admin/UsersTable";
import { BackLink } from "@/components/ui/BackLink";
import { loadAdminUsers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/supabase/require-admin";

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();
  const { users, error } = await loadAdminUsers(supabase);

  return (
    <div>
      <div className="mb-section-gap">
        <BackLink href="/admin" label="Dashboard" className="mb-3" />
        <h1 className="font-headline-xl text-headline-xl mb-2">Users</h1>
        <p className="font-body-lg text-secondary">
          All registered riders. New joins wait on Verifications until you approve them.
        </p>
      </div>
      {error && <p className="mb-4 text-error font-body-sm">{error}</p>}
      <UsersTable users={users} />
    </div>
  );
}
