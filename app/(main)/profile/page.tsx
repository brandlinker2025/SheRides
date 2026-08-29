"use client";

import { useAuth } from "@/lib/auth-context";
import { ProfileView } from "@/components/profile/ProfileView";

export default function MyProfilePage() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return <ProfileView rider={user} isSelf onSignOut={() => void signOut()} />;
}
