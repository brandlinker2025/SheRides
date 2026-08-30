"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, deleteEvent, updateEvent, type EventInput } from "@/app/admin/actions";
import type { AdminEventRow } from "@/lib/admin/queries";
import { img } from "@/lib/images";
import { Icon } from "@/components/ui/Icon";

const kinds: EventInput["kind"][] = ["Ride", "Workshop", "Meetup", "Tour"];

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyForm(): EventInput {
  return {
    title: "",
    description: "",
    kind: "Ride",
    location: "",
    startsAt: "",
    endsAt: "",
    coverUrl: img.coastalGroup,
    featured: false,
  };
}

function fromEvent(event: AdminEventRow): EventInput {
  return {
    title: event.title,
    description: event.description ?? "",
    kind: event.kind,
    location: event.location ?? "",
    startsAt: toLocalInput(event.starts_at),
    endsAt: toLocalInput(event.ends_at),
    coverUrl: event.cover_url ?? "",
    featured: event.featured,
  };
}

export function EventsManager({ events }: { events: AdminEventRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<EventInput>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = editingId ? await updateEvent(editingId, form) : await createEvent(form);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setForm(emptyForm());
    setEditingId(null);
    router.refresh();
  }

  async function onDelete(event: AdminEventRow) {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    setBusy(true);
    setError(null);
    const result = await deleteEvent(event.id);
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      if (editingId === event.id) {
        setEditingId(null);
        setForm(emptyForm());
      }
      router.refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
      <form
        onSubmit={onSubmit}
        className="xl:col-span-5 bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-6 flex flex-col gap-4"
      >
        <h2 className="font-headline-md text-headline-md">{editingId ? "Edit event" : "Create event"}</h2>
        {error && <p className="text-error font-body-sm">{error}</p>}
        <input
          required
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Title"
          className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta"
        />
        <textarea
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Description"
          rows={4}
          className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.kind}
            onChange={(e) => setField("kind", e.target.value as EventInput["kind"])}
            className="bg-soft-off-white border border-surface-border rounded-lg px-4 py-3"
          >
            {kinds.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
          <input
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="Location"
            className="bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta"
          />
        </div>
        <label className="font-body-sm text-secondary">
          Starts
          <input
            required
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setField("startsAt", e.target.value)}
            className="mt-1 w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3"
          />
        </label>
        <label className="font-body-sm text-secondary">
          Ends (optional)
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setField("endsAt", e.target.value)}
            className="mt-1 w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3"
          />
        </label>
        <input
          value={form.coverUrl}
          onChange={(e) => setField("coverUrl", e.target.value)}
          placeholder="Cover image URL"
          className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta"
        />
        <label className="flex items-center gap-2 font-label-lg">
          <input
            type="checkbox"
            checked={Boolean(form.featured)}
            onChange={(e) => setField("featured", e.target.checked)}
          />
          Featured event
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 h-12 bg-accent-magenta text-white rounded-lg font-label-lg"
          >
            {busy ? "Saving..." : editingId ? "Update event" : "Create event"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
              className="px-4 h-12 border border-outline rounded-lg font-label-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="xl:col-span-7 flex flex-col gap-4">
        {events.length === 0 && (
          <div className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-10 text-center font-body-sm text-tertiary">
            No events yet. Create the first ride or meetup.
          </div>
        )}
        {events.map((event) => (
          <article key={event.id} className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <img
                src={event.cover_url || img.coastalGroup}
                alt=""
                className="md:w-40 h-32 md:h-auto object-cover"
              />
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-label-caps text-accent-magenta">{event.kind.toUpperCase()}</p>
                    <h3 className="font-headline-md text-headline-md">{event.title}</h3>
                    <p className="font-body-sm text-secondary mt-1">
                      {new Date(event.starts_at).toLocaleString()} · {event.location || "Location TBD"}
                    </p>
                  </div>
                  {event.featured && (
                    <span className="font-label-caps text-[10px] bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                {event.description && <p className="font-body-sm text-tertiary mt-3">{event.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-body-sm text-tertiary flex items-center gap-1">
                    <Icon name="group" size={16} /> {event.attending_count} attending
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(event.id);
                        setForm(fromEvent(event));
                      }}
                      className="px-4 py-2 rounded-lg border border-outline font-label-lg"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDelete(event)}
                      className="px-4 py-2 rounded-lg bg-soft-off-white border border-error/50 text-error font-label-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
