"use client";

import { useState } from "react";
import { events } from "@/lib/data";
import { img } from "@/lib/images";
import { Icon } from "@/components/ui/Icon";

export default function EventsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [kind, setKind] = useState<"All" | "Rides" | "Workshops">("All");
  const [rsvp, setRsvp] = useState<Record<string, boolean>>({});
  const featured = events.find((e) => e.featured);
  const rest = events.filter((e) => !e.featured && (kind === "All" || (kind === "Rides" ? e.kind === "Ride" || e.kind === "Tour" || e.kind === "Meetup" : e.kind === "Workshop")));

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop py-section-gap">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-background mb-2">Events & Rides</h1>
          <p className="font-body-lg text-body-lg text-tertiary max-w-2xl">
            Discover upcoming scenic tours, technical workshops, and local meetups. Connect with fellow riders in a premium, curated environment.
          </p>
        </div>
        <div className="flex bg-soft-off-white p-1 rounded-lg border border-surface-border">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-6 py-2 rounded-md font-label-lg text-label-lg ${view === "list" ? "bg-white text-on-background shadow-premium" : "text-tertiary"}`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`px-6 py-2 rounded-md font-label-lg text-label-lg ${view === "calendar" ? "bg-white text-on-background shadow-premium" : "text-tertiary"}`}
          >
            Calendar
          </button>
        </div>
      </header>

      {featured && (
        <section className="mb-section-gap">
          <div className="bg-surface-container-lowest rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-300 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/2 aspect-video md:aspect-auto h-64 md:h-auto relative">
              <img src={featured.cover} alt={featured.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 chip px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm bg-white/90">
                <span className="w-2 h-2 rounded-full bg-accent-magenta" />
                <span className="font-label-caps text-label-caps text-accent-magenta">FEATURED TOUR</span>
              </div>
            </div>
            <div className="md:w-1/2 p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4 text-tertiary">
                <Icon name="calendar_today" size={16} />
                <span className="font-label-lg text-label-lg">{featured.dateLabel}</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-background mb-4">{featured.title}</h2>
              <p className="font-body-md text-body-md text-tertiary mb-6">{featured.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-3">
                  {[img.avatarSarah, img.avatarMia, img.avatarAlex].map((src) => (
                    <img key={src} src={src} alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-soft-off-white flex items-center justify-center font-label-caps text-label-caps text-tertiary">
                    +24
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRsvp((p) => ({ ...p, [featured.id]: !p[featured.id] }))}
                  className="bg-accent-magenta text-white font-label-lg text-label-lg px-8 py-3 rounded-lg hover:bg-primary transition-colors flex items-center gap-2"
                >
                  {rsvp[featured.id] ? "Joined" : "Join Ride"}
                  <Icon name="arrow_forward" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === "calendar" ? (
        <div className="bg-white rounded-xl shadow-premium p-8">
          <p className="font-headline-md text-headline-md mb-6">October — November</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((e) => (
              <div key={e.id} className="flex gap-4 p-4 rounded-lg border border-surface-border">
                <div className="min-w-[60px] text-center">
                  <p className="font-label-caps text-accent-magenta">{e.month}</p>
                  <p className="font-headline-md">{e.day}</p>
                </div>
                <div>
                  <p className="font-label-lg">{e.title}</p>
                  <p className="font-body-sm text-tertiary">{e.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <section>
          <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
            <h3 className="font-headline-md text-headline-md text-on-background">Upcoming Meetups & Workshops</h3>
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
            {rest.map((e) => (
              <div key={e.id} className="bg-surface-container-lowest rounded-xl shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
                <div className="aspect-video relative">
                  <img src={e.cover} alt={e.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-center">
                    <div className="font-label-caps text-label-caps text-accent-magenta">{e.month}</div>
                    <div className="font-headline-md text-headline-md text-on-background leading-none">{e.day}</div>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="chip w-fit px-2 py-1 rounded text-accent-magenta font-label-caps text-label-caps mb-3">
                    {e.kind.toUpperCase()}
                  </div>
                  <h4 className="font-label-lg text-label-lg text-on-background mb-2">{e.title}</h4>
                  <p className="font-body-sm text-body-sm text-tertiary mb-6 flex-grow">{e.description}</p>
                  <div className="flex items-center justify-between border-t border-surface-border pt-4">
                    <span className="font-body-sm text-body-sm text-tertiary">{e.attending} Attending</span>
                    <button
                      type="button"
                      onClick={() => setRsvp((p) => ({ ...p, [e.id]: !p[e.id] }))}
                      className="text-accent-magenta font-label-lg text-label-lg hover:text-primary"
                    >
                      {rsvp[e.id] ? "Going" : e.kind === "Workshop" ? "RSVP" : "Join Ride"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
