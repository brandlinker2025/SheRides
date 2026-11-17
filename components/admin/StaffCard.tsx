"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { addModerator, removeModerator } from "@/app/admin/staff-actions";

type Staff = { id: string; name: string; role: "admin" | "moderator"; email: string };

export function StaffCard({ staff }: { staff: Staff[] }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="card-surface p-5 mb-section-gap flex flex-col gap-4" aria-label="Admins and moderators">
      <div>
        <h2 className="font-headline-md text-[20px] font-bold">Admins &amp; moderators</h2>
        <p className="font-body-sm text-secondary">
          Staff sign in at sherides.online/admin-login with their email only. A login link is sent to that inbox. Moderators can
          review applications and manage rides; only admins see accounts and contacts.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {staff.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-xl border border-surface-border px-3 py-2">
            <Icon name={s.role === "admin" ? "shield_person" : "support_agent"} />
            <div className="min-w-0 flex-1">
              <p className="font-label-lg truncate">{s.name || s.email}</p>
              <p className="font-body-sm text-secondary truncate">{s.email} · {s.role}</p>
            </div>
            {s.role === "moderator" && (
              <button
                type="button"
                disabled={pending}
                className="btn btn-secondary h-10 min-h-10 px-4 text-sm"
                onClick={() => start(async () => setMsg(await removeModerator(s.id)))}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const result = await addModerator(email, name);
            setMsg(result);
            if (result.ok) {
              setEmail("");
              setName("");
            }
          });
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Name (optional)" className="h-12 rounded-xl border border-surface-border bg-soft-off-white px-4" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="moderator@email.com" className="h-12 rounded-xl border border-surface-border bg-soft-off-white px-4" />
        <button type="submit" disabled={pending} className="btn btn-primary h-12 px-5">
          <Icon name="person_add" size={20} /> {pending ? "Saving…" : "Add moderator"}
        </button>
      </form>
      {msg?.ok && <p className="font-body-sm text-green-700" role="status">{msg.ok}</p>}
      {msg?.error && <p className="font-body-sm text-error" role="alert">{msg.error}</p>}
    </section>
  );
}
