import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRelativeTime, toDiscoverableRiders } from "./profile";
import type { Rider } from "./types";

export const BASS_GIFT_FOLLOWERS = 1000;

export function hasBassGift(followers: number) {
  return followers >= BASS_GIFT_FOLLOWERS;
}

type Client = SupabaseClient;

export async function fetchFollowStats(supabase: Client, riderId: string, myId?: string | null) {
  const followersQuery = supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", riderId);
  const followingQuery = supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", riderId);
  const mineQuery =
    myId && myId !== riderId
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", myId)
          .eq("following_id", riderId)
          .maybeSingle()
      : Promise.resolve({ data: null as { follower_id?: string } | null, error: null });

  const [followersRes, followingRes, existing] = await Promise.all([
    followersQuery,
    followingQuery,
    mineQuery,
  ]);

  return {
    followers: followersRes.error ? null : (followersRes.count ?? 0),
    following: followingRes.error ? null : (followingRes.count ?? 0),
    isFollowing: Boolean(existing.data),
  };
}

export async function setFollowing(supabase: Client, myId: string, riderId: string, follow: boolean) {
  if (myId === riderId) return "You cannot follow yourself.";
  if (follow) {
    const { error } = await supabase.from("follows").insert({ follower_id: myId, following_id: riderId });
    if (error && error.code !== "23505") return error.message;
    return null;
  }
  const { error } = await supabase.from("follows").delete().eq("follower_id", myId).eq("following_id", riderId);
  return error?.message ?? null;
}

/** Home "Who's on SheRides" only: newest riders the current user does not already follow. */
export async function fetchUnfollowedRiders(supabase: Client, myId: string, limit = 24): Promise<Rider[]> {
  const [{ data: rows }, { data: follows }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(64),
    supabase.from("follows").select("following_id").eq("follower_id", myId),
  ]);
  const followed = new Set((follows ?? []).map((row) => row.following_id as string));
  return toDiscoverableRiders(
    (rows ?? []).filter((row) => !followed.has(row.id as string)) as Record<string, unknown>[],
    myId,
    limit
  );
}

export async function openDirectMessage(supabase: Client, otherId: string) {
  const { data, error } = await supabase.rpc("get_or_create_dm", { other_id: otherId });
  if (error || !data) {
    return { id: null as string | null, error: error?.message || "Could not open that conversation." };
  }
  return { id: String(data), error: null as string | null };
}

export async function sendConversationMessage(
  supabase: Client,
  conversationId: string,
  senderId: string,
  text: string
) {
  const { data, error } = await supabase.rpc("send_conversation_message", {
    target_conversation_id: conversationId,
    message_text: text,
  });
  if (!error && data) {
    return { id: String(data), error: null as string | null };
  }

  const inserted = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content: text })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    return {
      id: null as string | null,
      error: error?.message || inserted.error?.message || "Message could not be sent.",
    };
  }
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  return { id: inserted.data.id as string, error: null as string | null };
}

export type MessageReactionRow = {
  message_id: string;
  user_id: string;
  emoji: string;
};

function missingRelation(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST202" ||
    /could not find the (table|function)|schema cache|message_reactions|toggle_message_reaction/i.test(
      error.message ?? ""
    )
  );
}

export async function fetchMessageReactions(supabase: Client, messageIds: string[]) {
  if (!messageIds.length) return { rows: [] as MessageReactionRow[], error: null as string | null };
  const { data, error } = await supabase
    .from("message_reactions")
    .select("message_id, user_id, emoji")
    .in("message_id", messageIds);
  if (missingRelation(error)) return { rows: [] as MessageReactionRow[], error: null as string | null };
  if (error) return { rows: [] as MessageReactionRow[], error: error.message };
  return { rows: (data ?? []) as MessageReactionRow[], error: null as string | null };
}

export async function toggleMessageReaction(
  supabase: Client,
  messageId: string,
  userId: string,
  emoji: string,
  currentlyOn: boolean
) {
  const rpc = await supabase.rpc("toggle_message_reaction", {
    target_message_id: messageId,
    reaction_emoji: emoji,
  });
  if (!rpc.error) return null;
  if (!missingRelation(rpc.error)) return rpc.error.message;

  if (currentlyOn) {
    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
    if (missingRelation(error)) return null;
    return error?.message ?? null;
  }

  const { error } = await supabase
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: userId, emoji });
  if (error && error.code === "23505") return null;
  if (missingRelation(error)) return null;
  return error?.message ?? null;
}

export type PostComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
};

function mapPostComment(row: Record<string, unknown>): PostComment {
  const author = (Array.isArray(row.author) ? row.author[0] : row.author) as {
    id?: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
  return {
    id: String(row.id),
    authorId: author?.id ? String(author.id) : "",
    authorName: author?.full_name || "Rider",
    authorAvatar: author?.avatar_url || "",
    content: (row.content as string) || "",
    createdAt: formatRelativeTime(row.created_at as string),
  };
}

export async function fetchPostComments(supabase: Client, postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, author:profiles!author_id(id, full_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return { comments: [] as PostComment[], error: error.message };
  return { comments: (data ?? []).map((row) => mapPostComment(row as Record<string, unknown>)), error: null as string | null };
}

export async function addPostComment(
  supabase: Client,
  postId: string,
  authorId: string,
  content: string,
  author?: { fullName?: string; avatar?: string }
) {
  const body = content.trim().slice(0, 2000);
  if (!body) return { comment: null as PostComment | null, error: "Write a comment first." };
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, content: body })
    .select("id, content, created_at, author:profiles!author_id(id, full_name, avatar_url)")
    .single();
  if (error || !data) {
    if (error && /row-level security/i.test(error.message)) {
      return { comment: null as PostComment | null, error: "Could not post this comment. Please try again." };
    }
    return { comment: null as PostComment | null, error: error?.message || "Could not post this comment." };
  }
  const mapped = mapPostComment(data as Record<string, unknown>);
  if (!mapped.authorId) mapped.authorId = authorId;
  if (mapped.authorName === "Rider" && author?.fullName) mapped.authorName = author.fullName;
  if (!mapped.authorAvatar && author?.avatar) mapped.authorAvatar = author.avatar;
  return { comment: mapped, error: null as string | null };
}

export async function fetchUnreadNotificationCount(supabase: Client, userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) return 0;
  return count ?? 0;
}
