import Link from "next/link";
import { loadAdminEvents, loadAdminPosts, loadAdminStats, loadAdminUsers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { Icon } from "@/components/ui/Icon";

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();
  const [stats, usersResult, postsResult, eventsResult] = await Promise.all([
    loadAdminStats(supabase),
    loadAdminUsers(supabase),
    loadAdminPosts(supabase),
    loadAdminEvents(supabase),
  ]);

  const cards = [
    { label: "Total users", value: stats.users, href: "/admin/users", icon: "group" },
    { label: "Total posts", value: stats.posts, href: "/admin/posts", icon: "article" },
    { label: "Total events", value: stats.events, href: "/admin/events", icon: "event" },
    { label: "New signups today", value: stats.signupsToday, href: "/admin/users", icon: "person_add" },
  ];

  return (
    <div>
      <div className="mb-section-gap">
        <h1 className="font-headline-xl text-headline-xl mb-2">Dashboard</h1>
        <p className="font-body-lg text-secondary">Community stats and recent activity.</p>
      </div>
      {stats.error && (
        <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container font-body-sm">{stats.error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter mb-section-gap">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl shadow-premium border border-surface-border p-6 hover:shadow-premium-hover transition-shadow"
          >
            <Icon name={card.icon} className="text-accent-magenta" />
            <p className="font-display-lg text-[36px] text-on-background mt-3">{card.value}</p>
            <p className="font-label-caps text-label-caps text-tertiary mt-1">{card.label}</p>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
        <section className="bg-white rounded-xl shadow-premium border border-surface-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md">Recent riders</h2>
            <Link href="/admin/users" className="text-accent-magenta font-label-lg">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {usersResult.users.slice(-5).reverse().map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div>
                  <p className="font-label-lg">{user.full_name || "Unnamed rider"}</p>
                  <p className="font-body-sm text-tertiary">@{user.username || "rider"}</p>
                </div>
                {user.verified ? (
                  <Icon name="verified" filled className="text-accent-magenta" />
                ) : (
                  <span className="font-label-caps text-[10px] text-tertiary">Unverified</span>
                )}
              </div>
            ))}
            {usersResult.users.length === 0 && <p className="font-body-sm text-tertiary">No registered users yet.</p>}
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-premium border border-surface-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md">Latest posts</h2>
            <Link href="/admin/posts" className="text-accent-magenta font-label-lg">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {postsResult.posts.slice(0, 5).map((post) => (
              <div key={post.id}>
                <p className="font-label-lg">{post.author?.full_name || "Unknown rider"}</p>
                <p className="font-body-sm text-tertiary line-clamp-2">{post.content}</p>
              </div>
            ))}
            {postsResult.posts.length === 0 && <p className="font-body-sm text-tertiary">No posts yet.</p>}
          </div>
        </section>
      </div>
      {eventsResult.events.length > 0 && (
        <section className="bg-white rounded-xl shadow-premium border border-surface-border p-6 mt-gutter">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md">Upcoming events</h2>
            <Link href="/admin/events" className="text-accent-magenta font-label-lg">
              Manage
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {eventsResult.events.slice(0, 4).map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-label-lg">{event.title}</p>
                  <p className="font-body-sm text-tertiary">
                    {new Date(event.starts_at).toLocaleString()} · {event.location || "TBD"}
                  </p>
                </div>
                <span className="font-label-caps text-[10px] text-accent-magenta">{event.kind}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
