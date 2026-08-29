"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

const filters = ["All Regions", "Touring", "Technical", "Meetup"] as const;

type CommunityRow = {
  id: string;
  name: string;
  location: string;
  description: string;
  cover: string;
  members: number;
  activity?: string;
  category: string;
  joined: boolean;
};

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All Regions");
  const [communities, setCommunities] = useState<CommunityRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const load = async () => {
      const { data } = await supabase.from("communities").select("*").order("name");
      const { data: mine } = user
        ? await supabase.from("community_members").select("community_id").eq("user_id", user.id)
        : { data: [] };
      const joined = new Set((mine ?? []).map((row) => row.community_id as string));
      setCommunities(
        (data ?? []).map((row) => ({
          id: row.id as string,
          name: row.name as string,
          location: (row.location as string) || "",
          description: (row.description as string) || "",
          cover: (row.cover_url as string) || "",
          members: (row.members_count as number) ?? 0,
          activity: (row.activity as string) || undefined,
          category: (row.category as string) || "Meetup",
          joined: joined.has(row.id as string),
        }))
      );
    };
    void load();
  }, [user]);

  const list = useMemo(
    () =>
      communities.filter((c) => {
        const matchesFilter = filter === "All Regions" || c.category === filter;
        const q = query.toLowerCase();
        return matchesFilter && (c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
      }),
    [communities, query, filter]
  );

  async function toggleJoin(community: CommunityRow) {
    const supabase = createClient();
    if (!supabase || !user) return;
    if (community.joined) {
      await supabase.from("community_members").delete().eq("community_id", community.id).eq("user_id", user.id);
      setCommunities((prev) =>
        prev.map((c) => (c.id === community.id ? { ...c, joined: false, members: Math.max(0, c.members - 1) } : c))
      );
    } else {
      await supabase.from("community_members").insert({ community_id: community.id, user_id: user.id, status: "joined" });
      setCommunities((prev) =>
        prev.map((c) => (c.id === community.id ? { ...c, joined: true, members: c.members + 1 } : c))
      );
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop py-section-gap">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-section-gap gap-6">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-background mb-2">Communities</h1>
          <p className="font-body-md text-body-md text-secondary">Join city groups for women riders across Bangladesh.</p>
        </div>
        <div className="w-full md:w-96 relative">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-soft-off-white border border-surface-border rounded-full py-3 pl-12 pr-4 font-body-md text-body-md focus:outline-none focus:border-accent-magenta"
            placeholder="Search communities..."
          />
        </div>
      </div>

      <div className="flex gap-3 mb-8 overflow-x-auto pb-4 hide-scrollbar">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "px-6 py-2 rounded-full bg-accent-magenta/10 text-accent-magenta font-label-lg text-label-lg whitespace-nowrap border border-accent-magenta/20"
                : "px-6 py-2 rounded-full bg-surface border border-surface-border text-secondary hover:bg-surface-variant font-label-lg text-label-lg whitespace-nowrap"
            }
          >
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="No communities yet." body="Run supabase/seed.sql to add the four city groups." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {list.map((c) => (
            <article
              key={c.id}
              className="bg-surface-container-lowest rounded-xl shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative w-full aspect-video overflow-hidden bg-surface-variant">
                {c.cover && <img src={c.cover} alt="" className="w-full h-full object-cover" />}
                {c.activity && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-accent-magenta animate-pulse" />
                    <span className="font-label-caps text-label-caps text-on-background">{c.activity}</span>
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-headline-md text-headline-md text-on-background mb-1">{c.name}</h3>
                <p className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mb-4">
                  <Icon name="location_on" size={16} /> {c.location}
                </p>
                <p className="font-body-sm text-body-sm text-tertiary mb-6 line-clamp-2">{c.description}</p>
                <div className="mt-auto flex items-center justify-between border-t border-surface-border pt-4">
                  <span className="font-body-sm text-tertiary">{c.members} members</span>
                  <button
                    type="button"
                    onClick={() => void toggleJoin(c)}
                    className={
                      c.joined
                        ? "bg-surface border border-surface-border text-on-background font-label-lg text-label-lg px-6 py-2 rounded-lg"
                        : "bg-accent-magenta text-on-primary font-label-lg text-label-lg px-6 py-2 rounded-lg hover:bg-primary"
                    }
                  >
                    {c.joined ? "Joined" : "Join"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
