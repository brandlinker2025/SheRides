"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { riderFromProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";

export default function RiderProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [rider, setRider] = useState<Rider | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void supabase
      .from("profiles")
      .select("*")
      .or(`id.eq.${params.id},username.eq.${params.id}`)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setMissing(true);
        else setRider(riderFromProfile(data.id as string, data as Record<string, unknown>));
      });
  }, [params.id]);

  if (missing) {
    return (
      <div className="p-gutter">
        <BackLink href="/home" label="Home" className="mb-4" />
        <EmptyState title="Rider not found." />
      </div>
    );
  }
  if (!rider) {
    return <p className="p-gutter font-body-sm text-tertiary">Loading rider…</p>;
  }
  return (
    <div>
      <div className="px-container-margin-mobile md:px-container-margin-desktop pt-4">
        <BackLink href="/home" label="Home" />
      </div>
      <ProfileView rider={rider} isSelf={user?.id === rider.id} />
    </div>
  );
}
