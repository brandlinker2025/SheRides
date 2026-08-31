import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { ADMIN_OPEN_ACCESS } from "@/lib/admin/open-access";

export default function AdminLoginPage() {
  if (ADMIN_OPEN_ACCESS) {
    redirect("/admin");
  }

  return (
    <Suspense>
      <LoginPanel admin />
    </Suspense>
  );
}
