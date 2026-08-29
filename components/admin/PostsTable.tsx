"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/app/admin/actions";
import type { AdminPostRow } from "@/lib/admin/queries";
import { currentUser } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PostsTable({ posts }: { posts: AdminPostRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(post: AdminPostRow) {
    if (!window.confirm("Delete this post permanently?")) return;
    setBusyId(post.id);
    setError(null);
    const result = await deletePost(post.id);
    setBusyId(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-error font-body-sm">{error}</p>}
      {posts.length === 0 && (
        <div className="bg-white rounded-xl shadow-premium border border-surface-border p-10 text-center font-body-sm text-tertiary">
          No posts yet.
        </div>
      )}
      {posts.map((post) => (
        <article key={post.id} className="bg-white rounded-xl shadow-premium border border-surface-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author?.avatar_url || currentUser.avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-label-lg">{post.author?.full_name || "Unknown rider"}</p>
                  {post.author?.verified && <Icon name="verified" filled className="text-accent-magenta" size={16} />}
                </div>
                <p className="font-body-sm text-tertiary">{formatDate(post.created_at)}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={busyId === post.id}
              onClick={() => onDelete(post)}
              className="px-4 py-2 rounded-lg bg-soft-off-white border border-error/50 text-error font-label-lg"
            >
              {busyId === post.id ? "Deleting..." : "Delete"}
            </button>
          </div>
          <p className="font-body-md mt-4 whitespace-pre-wrap">{post.content}</p>
          {post.image_url && (
            <img src={post.image_url} alt="" className="mt-4 w-full max-h-72 object-cover rounded-lg" />
          )}
          <div className="mt-4 flex gap-4 font-body-sm text-tertiary">
            {post.location && (
              <span className="flex items-center gap-1">
                <Icon name="location_on" size={16} /> {post.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="favorite" size={16} /> {post.likes_count}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
