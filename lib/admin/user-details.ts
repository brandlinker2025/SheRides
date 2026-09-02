import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminUserDetailRow = {
  id: string;
  username: string | null;
  full_name: string;
  mobile_number: string | null;
  date_of_birth: string | null;
  bike_brand: string | null;
  location: string | null;
  role: string;
  verified: boolean;
  created_at: string;
  avatar_url: string | null;
};

export async function loadAdminUserDetails(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("admin_list_user_details");
  return {
    users: (data ?? []) as AdminUserDetailRow[],
    error: error?.message ?? null,
  };
}
