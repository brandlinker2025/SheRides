import { requireUser } from "@/lib/supabase/require-user";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
