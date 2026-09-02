import { UserDetailsTable } from "@/components/admin/UserDetailsTable";
import { BackLink } from "@/components/ui/BackLink";
import { loadAdminUserDetails } from "@/lib/admin/user-details";
import { requireAdmin } from "@/lib/supabase/require-admin";

export default async function AdminUserDetailsPage() {
  const { supabase } = await requireAdmin();
  const { users, error } = await loadAdminUserDetails(supabase);

  return (
    <div>
      <div className="mb-section-gap">
        <BackLink href="/admin/users" label="Users" className="mb-3" />
        <h1 className="font-headline-xl text-headline-xl mb-2">User Details</h1>
        <p className="font-body-lg text-secondary">
          Private admin-only rider information: name, mobile number, birthday and bike brand.
        </p>
      </div>
      {error && <p className="mb-4 text-error font-body-sm">{error}</p>}
      <UserDetailsTable users={users} />
    </div>
  );
}
