"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { img } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";

type EventRow = {
  id: string;
  title: string;
  description: string;
  kind: string;
  location: string;
  starts_at: string;
  cover_url: string | null;
  attending_count: number;
  featured: boolean;
  going: boolean;
};

function dateParts(value: string) {
  const date = new Date(value);
  return {
    month: date.toLocaleString(undefined, { month: "short" }).toUpperCase(),
    day: String(date.getDate()),
    label: date.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" }),
  };
}

export default function EventsPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [kind, setKind] = useState<"All" | "Rides" | "Workshops">("All");
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const load = async () => {
      const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
      const { data: mine } = user
        ? await supabase.from("event_rsvps").select("event_id").eq("user_id", user.id)
        : { data: [] };
      const going = new Set((mine ?? []).map((row) => row.event_id as string));
      setEvents(
        (data ?? []).map((row) => ({
          id: row.id as string,
          title: row.title as string,
          description: (row.description as string) || "",
          kind: row.kind as string,
          location: (row.location as string) || "",
          starts_at: row.starts_at as string,
          cover_url: (row.cover_url as string) || null,
          attending_count: (row.attending_count as number) ?? 0,
          featured: Boolean(row.featured),
          going: going.has(row.id as string),
        }))
      );
    };
    void load();
  }, [user]);

  async function toggleRsvp(event: EventRow) {
    const supabase = createClient();
    if (!supabase || !user) return;
    if (event.going) {
      await supabase.from("event_rsvps").delete().eq("event_id", event.id).eq("user_id", user.id);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, going: false, attending_count: Math.max(0, e.attending_count - 1) } : e
        )
      );
    } else {
      await supabase.from("event_rsvps").insert({ event_id: event.id, user_id: user.id });
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, going: true, attending_count: e.attending_count + 1 } : e))
      );
    }
  }

  const featured = events.find((e) => e.featured);
  const rest = events.filter(
    (e) =>
      !e.featured &&
      (kind === "All" ||
        (kind === "Rides" ? e.kind === "Ride" || e.kind === "Tour" || e.kind === "Meetup" : e.kind === "Workshop"))
  );

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop py-section-gap">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-background mb-2">Events & Rides</h1>
          <p className="font-body-lg text-body-lg text-tertiary max-w-2xl">
            Scenic tours, workshops, and city meetups for women riders in Bangladesh.
          </p>
        </div>
        <div className="flex bg-soft-off-white p-1 rounded-lg border border-surface-border">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-6 py-2 rounded-md font-label-lg text-label-lg transition-all duration-200 ${view === "list" ? "bg-surface-container-lowest text-on-background shadow-premium" : "text-tertiary"}`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`px-6 py-2 rounded-md font-label-lg text-label-lg transition-all duration-200 ${view === "calendar" ? "bg-surface-container-lowest text-on-background shadow-premium" : "text-tertiary"}`}
          >
            Calendar
          </button>
        </div>
      </header>

      {events.length === 0 && (
        <EmptyState variant="events" title="No events yet." body="Admins can add rides from the admin panel." />
      )}

      {featured && (
        <section className="mb-section-gap">
          <div className="bg-surface-container-lowest rounded-xl shadow-premium overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/2 aspect-video md:aspect-auto h-64 md:h-auto relative">
              <img src={featured.cover_url || img.coastalGroup} alt={featured.title} className="w-full h-full object-cover" />
            </div>
            <div className="md:w-1/2 p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4 text-tertiary">
                <Icon name="calendar_today" size={16} />
                <span className="font-label-lg text-label-lg">{dateParts(featured.starts_at).label}</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-background mb-4">{featured.title}</h2>
              <p className="font-body-md text-body-md text-tertiary mb-6">{featured.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="font-body-sm text-tertiary">{featured.attending_count} attending</span>
                <button
                  type="button"
                  onClick={() => void toggleRsvp(featured)}
                  className="bg-accent-magenta text-white font-label-lg text-label-lg px-8 py-3 rounded-lg"
                >
                  {featured.going ? "Going" : "RSVP"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === "calendar" ? (
        <div className="card-surface p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((e) => {
              const parts = dateParts(e.starts_at);
              return (
                <div
                  key={e.id}
                  className="flex gap-4 p-4 rounded-lg border border-surface-border transition-colors duration-200 hover:bg-soft-off-white"
                >
                  <div className="min-w-[60px] text-center">
                    <p className="font-label-caps text-accent-magenta">{parts.month}</p>
                    <p className="font-headline-md">{parts.day}</p>
                  </div>
                  <div>
                    <p className="font-label-lg">{e.title}</p>
                    <p className="font-body-sm text-tertiary">{e.location}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        rest.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
              <h3 className="font-headline-md text-headline-md text-on-background">Upcoming meetups & workshops</h3>
              <div className="flex gap-2">
                {(["All", "Rides", "Workshops"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={
                      kind === k
                        ? "chip px-4 py-2 rounded-full font-label-lg text-label-lg text-accent-magenta"
                        : "px-4 py-2 rounded-full font-label-lg text-label-lg text-tertiary hover:bg-soft-off-white"
                    }
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-component-gap">
              {rest.map((e) => {
                const parts = dateParts(e.starts_at);
                return (
                  <div key={e.id} className="card-surface card-hover overflow-hidden flex flex-col">
                    <div className="aspect-video relative">
                      <img src={e.cover_url || img.canyon} alt={e.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded text-center">
                        <div className="font-label-caps text-label-caps text-accent-magenta">{parts.month}</div>
                        <div className="font-headline-md text-headline-md leading-none">{parts.day}</div>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="chip w-fit px-2 py-1 rounded text-accent-magenta font-label-caps text-label-caps mb-3">
                        {e.kind.toUpperCase()}
                      </div>
                      <h4 className="font-label-lg text-label-lg mb-2">{e.title}</h4>
                      <p className="font-body-sm text-body-sm text-tertiary mb-6 flex-grow">{e.description}</p>
                      <div className="flex items-center justify-between border-t border-surface-border pt-4">
                        <span className="font-body-sm text-tertiary">{e.attending_count} attending</span>
                        <button
                          type="button"
                          onClick={() => void toggleRsvp(e)}
                          className="text-accent-magenta font-label-lg"
                        >
                          {e.going ? "Going" : "RSVP"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}
