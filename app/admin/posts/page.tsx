import { PostsTable } from "@/components/admin/PostsTable";
import { BackLink } from "@/components/ui/BackLink";
import { loadAdminPosts } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/supabase/require-admin";

export default async function AdminPostsPage() {
  const { supabase } = await requireAdmin();
  const { posts, error } = await loadAdminPosts(supabase);

  return (
    <div>
      <div className="mb-section-gap">
        <BackLink href="/admin" label="Dashboard" className="mb-3" />
        <h1 className="font-headline-xl text-headline-xl mb-2">Posts</h1>
        <p className="font-body-lg text-secondary">Review community posts and remove anything that should not stay up.</p>
      </div>
      {error && <p className="mb-4 text-error font-body-sm">{error}</p>}
      <PostsTable posts={posts} />
    </div>
  );
}
