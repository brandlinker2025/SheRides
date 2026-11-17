import { Suspense } from "react";
import { StaffLoginPanel } from "@/components/auth/StaffLoginPanel";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <StaffLoginPanel />
    </Suspense>
  );
}
