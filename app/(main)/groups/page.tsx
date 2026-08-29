"use client";

import { useMemo, useState } from "react";
import { communities } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";

const filters = ["All Regions", "Touring", "Technical", "Meetup"] as const;

export default function CommunitiesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All Regions");
  const [status, setStatus] = useState<Record<string, "join" | "requested" | "joined">>(() =>
    Object.fromEntries(
      communities.map((c) => [c.id, c.joined ? "joined" : c.requested ? "requested" : "join"])
    )
  );

  const list = useMemo(
    () =>
      communities.filter((c) => {
        const matchesFilter = filter === "All Regions" || c.category === filter;
        const q = query.toLowerCase();
        return matchesFilter && (c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
      }),
    [query, filter]
  );

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop py-section-gap">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-section-gap gap-6">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-background mb-2">Communities</h1>
          <p className="font-body-md text-body-md text-secondary">Discover and join local female rider groups.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {list.map((c) => (
          <article
            key={c.id}
            className="bg-surface-container-lowest rounded-xl shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col group"
          >
            <div className="relative w-full aspect-video overflow-hidden bg-surface-variant">
              <img src={c.cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                <div className="flex -space-x-2">
                  {c.memberAvatars.map((src) => (
                    <img key={src} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-variant flex items-center justify-center font-label-caps text-label-caps text-secondary text-xs">
                    +{c.members > 999 ? `${(c.members / 1000).toFixed(1)}k` : c.members}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setStatus((prev) => ({
                      ...prev,
                      [c.id]: prev[c.id] === "join" ? "joined" : "join",
                    }))
                  }
                  className={
                    status[c.id] === "join"
                      ? "bg-accent-magenta text-on-primary font-label-lg text-label-lg px-6 py-2 rounded-lg hover:bg-primary"
                      : "bg-surface border border-surface-border text-on-background font-label-lg text-label-lg px-6 py-2 rounded-lg"
                  }
                >
                  {status[c.id] === "join" ? "Join" : status[c.id] === "requested" ? "Requested" : "Joined"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
