"use client";

import { useMemo, useState } from "react";
import type { AdminUserDetailRow } from "@/lib/admin/user-details";
import { Avatar } from "@/components/ui/Avatar";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function UserDetailsTable({ users }: { users: AdminUserDetailRow[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUserDetailRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.full_name, user.username, user.mobile_number, user.bike_brand, user.location, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [users, query]);

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-premium overflow-hidden">
        <div className="p-4 border-b border-surface-border flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <p className="font-body-sm text-secondary">{filtered.length} riders</p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, mobile, city, brand..."
            className="w-full md:w-96 bg-soft-off-white border border-surface-border rounded-lg px-4 py-2 font-body-sm focus:outline-none focus:border-accent-magenta"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-soft-off-white font-label-caps text-label-caps text-tertiary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile number</th>
                <th className="px-4 py-3">Birthday</th>
                <th className="px-4 py-3">Bike brand</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t border-surface-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar_url} alt={user.full_name} size={40} />
                      <div>
                        <p className="font-label-lg">{user.full_name || "Unnamed rider"}</p>
                        <p className="font-body-sm text-tertiary">@{user.username || "rider"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-secondary">{user.mobile_number || "—"}</td>
                  <td className="px-4 py-3 font-body-sm text-secondary">{formatDate(user.date_of_birth)}</td>
                  <td className="px-4 py-3 font-body-sm text-secondary">{user.bike_brand || "—"}</td>
                  <td className="px-4 py-3 font-body-sm text-secondary">{user.location || "—"}</td>
                  <td className="px-4 py-3 font-body-sm text-secondary">{user.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-label-lg ${user.verified ? "bg-green-500/15 text-green-600" : "bg-amber-500/15 text-amber-600"}`}>
                      {user.role === "admin" ? "admin" : user.verified ? "approved" : "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-secondary">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setSelected(user)} className="px-3 py-2 rounded-lg border border-surface-border font-label-lg text-label-lg hover:border-accent-magenta">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center font-body-sm text-tertiary">No riders match this search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex justify-end" onClick={() => setSelected(null)}>
          <aside className="h-full w-full max-w-md bg-surface-container-lowest p-6 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-headline-md text-headline-md">User Details</h2>
                <p className="font-body-sm text-secondary">Complete rider information</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-2xl leading-none">×</button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <Avatar src={selected.avatar_url} alt={selected.full_name} size={72} />
              <div>
                <p className="font-headline-sm text-headline-sm">{selected.full_name}</p>
                <p className="font-body-sm text-secondary">@{selected.username || "rider"}</p>
              </div>
            </div>
            <div className="rounded-xl border border-surface-border p-4 space-y-3">
              <Detail label="Name" value={selected.full_name} />
              <Detail label="Mobile number" value={selected.mobile_number || "—"} />
              <Detail label="Birthday" value={formatDate(selected.date_of_birth)} />
              <Detail label="Bike brand" value={selected.bike_brand || "—"} />
              <Detail label="Location" value={selected.location || "—"} />
              <Detail label="Role" value={selected.role} />
              <Detail label="Status" value={selected.role === "admin" ? "Admin" : selected.verified ? "Approved" : "Pending"} />
              <Detail label="Joined" value={formatDate(selected.created_at)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <span className="font-body-sm text-tertiary">{label}</span>
      <span className="font-body-sm text-on-surface break-words">{value}</span>
    </div>
  );
}
