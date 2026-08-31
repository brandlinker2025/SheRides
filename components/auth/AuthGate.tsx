"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_OPEN_ACCESS } from "@/lib/admin/open-access";
import { useAuth } from "@/lib/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-label-lg text-accent-magenta">Checking sign in...</p>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ADMIN_OPEN_ACCESS) return;
    if (loading) return;
    if (!user) {
      router.replace("/admin-login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/home");
    }
  }, [loading, user, router]);

  if (ADMIN_OPEN_ACCESS) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-label-lg text-accent-magenta">Checking admin access...</p>
      </div>
    );
  }

  if (user.role !== "admin") return null;
  return <>{children}</>;
}
