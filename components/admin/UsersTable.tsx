"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setRiderVerified } from "@/app/admin/actions";
import type { AdminUserRow } from "@/lib/admin/queries";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UsersTable({
  users,
  emptyLabel = "No riders match this search.",
}: {
  users: AdminUserRow[];
  emptyLabel?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? users
      : users.filter((user) =>
          [user.full_name, user.username, user.location, user.role]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q))
        );
    return [...list].sort((a, b) => Number(a.verified) - Number(b.verified));
  }, [users, query]);

  async function setAccess(user: AdminUserRow, verified: boolean) {
    setBusyId(user.id);
    setError(null);
    const result = await setRiderVerified(user.id, verified);
    setBusyId(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border overflow-hidden">
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
              <th className="px-4 py-3 text-right">Access</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-surface-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar_url} alt={user.full_name} size={40} />
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
                  {user.role === "admin" ? (
                    <span className="font-body-sm text-secondary">Admin</span>
                  ) : user.verified ? (
                    <button
                      type="button"
                      disabled={busyId === user.id}
                      onClick={() => void setAccess(user, false)}
                      className="px-4 py-2 rounded-lg font-label-lg text-label-lg bg-soft-off-white border border-surface-border text-secondary disabled:opacity-60"
                    >
                      {busyId === user.id ? "Saving..." : "Revoke access"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === user.id}
                      onClick={() => void setAccess(user, true)}
                      className="inline-flex px-4 py-2 rounded-lg font-label-lg text-label-lg bg-accent-magenta text-white disabled:opacity-60"
                    >
                      {busyId === user.id ? "Saving..." : "Approve"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-body-sm text-tertiary">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
