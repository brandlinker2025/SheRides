"use client";

import { useAuth } from "@/lib/auth-context";
import { ProfileView } from "@/components/profile/ProfileView";
import { BackLink } from "@/components/ui/BackLink";

export default function MyProfilePage() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-gutter font-body-sm text-tertiary">Loading profile…</p>;
  if (!user) return null;
  return (
    <div>
      <div className="px-container-margin-mobile md:px-container-margin-desktop pt-4">
        <BackLink href="/home" label="Home" />
      </div>
      <ProfileView rider={user} isSelf />
    </div>
  );
}
