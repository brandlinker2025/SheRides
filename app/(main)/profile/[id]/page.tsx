"use client";

import { useParams } from "next/navigation";
import { findRider } from "@/lib/data";
import { ProfileView } from "@/components/profile/ProfileView";

export default function RiderProfilePage() {
  const params = useParams<{ id: string }>();
  const rider = findRider(params.id);
  return <ProfileView rider={rider} />;
}
