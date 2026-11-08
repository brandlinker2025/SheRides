import { Suspense } from "react";
import { LoginPanel } from "@/components/auth/LoginPanel";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginPanel admin />
    </Suspense>
  );
}
