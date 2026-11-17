"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { addModerator, createStaffLink, removeModerator, revokeStaffLinks } from "@/app/admin/staff-actions";

type Staff = { id: string; name: string; role: "admin" | "moderator"; email: string };
type Result = { ok?: string; error?: string; link?: string };

export function StaffCard({ staff }: { staff: Staff[] }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      setCopied(false);
      setMsg(await fn());
    });

  return (
    <section className="card-surface p-5 mb-section-gap flex flex-col gap-4" aria-label="Admins and moderators">
      <div>
        <h2 className="font-headline-md text-[20px] font-bold">Admins &amp; moderators</h2>
        <p className="font-body-sm text-secondary">
          প্রত্যেক staff-এর একটা private login link থাকে। লিংকটা একবার ফোনে খুললেই ঢুকে যাবে, পাসওয়ার্ড বা ইমেইল লাগবে না। লিংকটা
          শুধু তাকেই পাঠান — যার কাছে লিংক থাকবে সে-ই ঢুকতে পারবে। Moderator শুধু Approvals (রাইডার approve, pre-booking, ride) দেখতে পারে।
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {staff.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-border px-3 py-2">
            <Icon name={s.role === "admin" ? "shield_person" : "support_agent"} />
            <div className="min-w-0 flex-1">
              <p className="font-label-lg truncate">{s.name || s.email}</p>
              <p className="font-body-sm text-secondary truncate">
                {s.role === "admin" ? "Main admin" : "Moderator"}
                {s.email && !s.email.endsWith("@staff.sherides.online") ? ` · ${s.email}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending} className="btn btn-primary h-10 min-h-10 px-4 text-sm" onClick={() => run(() => createStaffLink(s.id))}>
                <Icon name="key" size={18} /> Login link
              </button>
              <button type="button" disabled={pending} className="btn btn-secondary h-10 min-h-10 px-4 text-sm" onClick={() => run(() => revokeStaffLinks(s.id))}>
                Link বাতিল
              </button>
              {s.role === "moderator" && (
                <button type="button" disabled={pending} className="btn btn-secondary h-10 min-h-10 px-4 text-sm" onClick={() => run(() => removeModerator(s.id))}>
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {msg?.link && (
        <div className="rounded-xl border-2 border-accent-magenta p-4 flex flex-col gap-2" role="status">
          <p className="font-body-sm font-bold">{msg.ok}</p>
          <code className="block break-all rounded-lg bg-soft-off-white p-2 text-xs">{msg.link}</code>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary h-10 min-h-10 px-4 text-sm"
              onClick={() => {
                void navigator.clipboard?.writeText(msg.link ?? "");
                setCopied(true);
              }}
            >
              <Icon name={copied ? "check" : "content_copy"} size={18} /> {copied ? "Copied" : "Copy"}
            </button>
            <a
              className="btn btn-secondary h-10 min-h-10 px-4 text-sm"
              href={`https://wa.me/?text=${encodeURIComponent(`SheRides staff login (private, কাউকে দেবেন না): ${msg.link}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="share" size={18} /> WhatsApp
            </a>
          </div>
          <p className="font-body-sm text-secondary">এই লিংক এখন একবারই দেখানো হচ্ছে। হারালে আবার &quot;Login link&quot; চাপুন — পুরনোটা বন্ধ হয়ে নতুন তৈরি হবে।</p>
        </div>
      )}
      {msg && !msg.link && msg.ok && <p className="font-body-sm text-green-700" role="status">{msg.ok}</p>}
      {msg?.error && <p className="font-body-sm text-error" role="alert">{msg.error}</p>}

      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const result = await addModerator(email, name);
            if (result.ok) {
              setEmail("");
              setName("");
            }
            return result;
          });
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Moderator-এর নাম (যেমন Sneha)" className="h-12 rounded-xl border border-surface-border bg-soft-off-white px-4" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="ইমেইল (ঐচ্ছিক)" className="h-12 rounded-xl border border-surface-border bg-soft-off-white px-4" />
        <button type="submit" disabled={pending} className="btn btn-primary h-12 px-5">
          <Icon name="person_add" size={20} /> {pending ? "Saving…" : "Add moderator"}
        </button>
      </form>
    </section>
  );
}
