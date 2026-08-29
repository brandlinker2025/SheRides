"use client";

import { useAuth } from "@/lib/auth-context";
import { ProfileView } from "@/components/profile/ProfileView";

export default function MyProfilePage() {
  const { user, loading, signOut } = useAuth();
  if (loading) return null;
  if (!user) return null;
  return <ProfileView rider={user} isSelf onSignOut={() => void signOut()} />;
}
