"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setRiderVerified } from "@/app/admin/actions";
import type { AdminUserRow } from "@/lib/admin/queries";
import { currentUser } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.full_name, user.username, user.location, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [users, query]);

  async function toggleVerified(user: AdminUserRow) {
    setBusyId(user.id);
    setError(null);
    const result = await setRiderVerified(user.id, !user.verified);
    setBusyId(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="bg-white rounded-xl shadow-premium border border-surface-border overflow-hidden">
      <div className="p-4 border-b border-surface-border flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p className="font-body-sm text-secondary">{filtered.length} riders</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, username, city..."
          className="w-full md:w-80 bg-soft-off-white border border-surface-border rounded-lg px-4 py-2 font-body-sm focus:outline-none focus:border-accent-magenta"
        />
      </div>
      {error && <p className="px-4 pt-4 text-error font-body-sm">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-soft-off-white font-label-caps text-label-caps text-tertiary">
            <tr>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Verified</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-surface-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar_url || currentUser.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-label-lg">{user.full_name || "Unnamed rider"}</p>
                        {user.verified && <Icon name="verified" filled className="text-accent-magenta" size={16} />}
                      </div>
                      <p className="font-body-sm text-tertiary">@{user.username || "rider"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-body-sm text-secondary">{user.location || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-label-caps text-[10px] px-2 py-1 rounded-full ${
                      user.role === "admin" ? "bg-primary-fixed text-on-primary-fixed" : "bg-soft-off-white text-tertiary"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-body-sm text-secondary">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={busyId === user.id}
                    onClick={() => toggleVerified(user)}
                    className={`px-4 py-2 rounded-lg font-label-lg text-label-lg ${
                      user.verified
                        ? "bg-soft-off-white border border-surface-border text-secondary"
                        : "bg-accent-magenta text-white"
                    }`}
                  >
                    {busyId === user.id ? "Saving..." : user.verified ? "Unverify" : "Verify"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-body-sm text-tertiary">
                  No riders match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
