"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { BackButton } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime } from "@/lib/profile";
import { openDirectMessage, sendConversationMessage } from "@/lib/social";
import { createClient } from "@/lib/supabase/client";

type ConversationItem = {
  id: string;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread: boolean;
};

type MessageItem = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
};

function isUnread(lastAt?: string, lastReadAt?: string | null, lastFromMe?: boolean) {
  if (!lastAt || lastFromMe) return false;
  if (!lastReadAt) return true;
  return new Date(lastAt).getTime() > new Date(lastReadAt).getTime();
}

function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const queryId = params.get("c");
  const toId = params.get("to");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(queryId);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<"All" | "Unread">("All");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const openThread = useCallback(
    (id: string | null) => {
      setActiveId(id);
      router.replace(id ? `/messages?c=${id}` : "/messages", { scroll: false });
    },
    [router]
  );

  const loadConversations = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !user) {
      setLoadingList(false);
      setError(supabase ? null : "Messaging is not configured.");
      return;
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);
    if (membershipError) {
      setError(membershipError.message);
      setLoadingList(false);
      return;
    }

    const ids = (memberships ?? []).map((row) => row.conversation_id as string);
    if (!ids.length) {
      setConversations([]);
      setLoadingList(false);
      return;
    }

    const [{ data: members }, { data: lastMessages }] = await Promise.all([
      supabase
        .from("conversation_members")
        .select("conversation_id, user_id, profiles(full_name, avatar_url)")
        .in("conversation_id", ids),
      supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false }),
    ]);

    const items: ConversationItem[] = ids.map((id) => {
      const membership = (memberships ?? []).find((row) => row.conversation_id === id);
      const others = (members ?? []).filter((m) => m.conversation_id === id && m.user_id !== user.id);
      const other = others[0];
      const profile = (other?.profiles && (Array.isArray(other.profiles) ? other.profiles[0] : other.profiles)) as
        | { full_name?: string; avatar_url?: string }
        | undefined;
      const last = (lastMessages ?? []).find((m) => m.conversation_id === id);
      return {
        id,
        name: profile?.full_name || "SheRides chat",
        avatar: profile?.avatar_url || "",
        preview: last?.content || "No messages yet",
        time: formatRelativeTime(last?.created_at as string | undefined),
        unread: isUnread(last?.created_at as string | undefined, membership?.last_read_at as string | null, last?.sender_id === user.id),
      };
    });
    setConversations(items);
    setError(null);
    setLoadingList(false);
  }, [user]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (queryId && queryId !== activeId) setActiveId(queryId);
  }, [queryId, activeId]);

  useEffect(() => {
    if (!toId || !user || queryId) return;
    if (toId === user.id) {
      setSendError("You cannot message yourself.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setSendError("Messaging is not configured.");
      return;
    }
    let cancelled = false;
    void openDirectMessage(supabase, toId).then(({ id, error: openError }) => {
      if (cancelled) return;
      if (!id) {
        setSendError(openError || "Could not open that conversation.");
        return;
      }
      setActiveId(id);
      router.replace(`/messages?c=${id}`, { scroll: false });
      void loadConversations();
    });
    return () => {
      cancelled = true;
    };
  }, [toId, queryId, user, router, loadConversations]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user || !activeId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingThread(true);
    void supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .then(async ({ data, error: threadError }) => {
        if (cancelled) return;
        if (threadError) {
          setSendError(threadError.message);
          setLoadingThread(false);
          return;
        }
        setMessages(
          (data ?? []).map((row) => ({
            id: row.id as string,
            fromMe: row.sender_id === user.id,
            text: (row.content as string) || "",
            time: formatRelativeTime(row.created_at as string),
          }))
        );
        setLoadingThread(false);
        await supabase
          .from("conversation_members")
          .update({ last_read_at: new Date().toISOString() })
          .eq("conversation_id", activeId)
          .eq("user_id", user.id);
        setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, unread: false } : c)));
      });

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const row = payload.new as { id: string; sender_id: string; content?: string; created_at: string };
          setMessages((prev) => {
            if (prev.some((item) => item.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                fromMe: row.sender_id === user.id,
                text: row.content || "",
                time: formatRelativeTime(row.created_at),
              },
            ];
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeId
                ? { ...c, preview: row.content || c.preview, time: "Just now", unread: row.sender_id !== user.id }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [activeId, user]);

  const active = conversations.find((c) => c.id === activeId);
  const list = useMemo(
    () => conversations.filter((c) => (filter === "Unread" ? c.unread : true)),
    [conversations, filter]
  );

  async function send() {
    const text = draft.trim();
    const supabase = createClient();
    if (!text || !supabase || !user || !activeId) return;
    setSendError(null);
    setDraft("");
    const { id, error: insertError } = await sendConversationMessage(supabase, activeId, user.id, text);
    if (!id) {
      setDraft(text);
      setSendError(insertError || "Message could not be sent.");
      return;
    }
    setMessages((prev) =>
      prev.some((item) => item.id === id) ? prev : [...prev, { id, fromMe: true, text, time: "Just now" }]
    );
    setConversations((prev) => {
      if (prev.some((c) => c.id === activeId)) {
        return prev.map((c) => (c.id === activeId ? { ...c, preview: text, time: "Just now", unread: false } : c));
      }
      return [
        { id: activeId, name: "SheRides chat", avatar: "", preview: text, time: "Just now", unread: false },
        ...prev,
      ];
    });
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <EmptyState title="Sign in to read messages." body="Your SheRides conversations stay private." />
      </div>
    );
  }

  return (
    <div className="lg:p-6 p-0 max-w-[1600px] mx-auto h-full min-h-[480px]">
      <div className="flex bg-surface-container-lowest lg:rounded-xl lg:shadow-premium border-y lg:border border-surface-border overflow-hidden w-full h-full">
        <div className={`${activeId && "hidden md:flex"} w-full md:w-[320px] xl:w-[360px] flex-shrink-0 border-r border-surface-border bg-soft-off-white flex flex-col h-full`}>
          <div className="p-4 border-b border-surface-border bg-surface-container-lowest">
            <h1 className="font-headline-md text-headline-md text-on-surface mb-4">Messages</h1>
            <div className="flex gap-2">
              {(["All", "Unread"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 font-label-lg text-[13px] rounded-full ${
                    filter === f ? "bg-primary-fixed-dim text-on-primary-fixed" : "bg-surface-container-high text-secondary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList && <p className="p-6 font-body-sm text-tertiary">Loading conversations…</p>}
            {error && (
              <p className="p-6 font-body-sm text-error" role="alert">
                {error}
              </p>
            )}
            {!loadingList && !error && list.length === 0 && (
              <p className="p-6 font-body-sm text-tertiary">
                {filter === "Unread"
                  ? "No unread messages."
                  : "No conversations yet. Open a rider from Home and tap Message."}
              </p>
            )}
            {sendError && !activeId ? (
              <p className="px-6 pb-4 font-body-sm text-error" role="alert">
                {sendError}
              </p>
            ) : null}
            {list.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openThread(c.id)}
                className={`w-full flex items-center gap-3 p-4 text-left border-l-4 ${
                  c.id === activeId ? "bg-surface border-accent-magenta" : "border-transparent hover:bg-surface-container-low"
                }`}
              >
                <Avatar src={c.avatar} alt={c.name} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-label-lg text-label-lg truncate">{c.name}</h3>
                    <span className="text-[11px] text-tertiary">{c.time}</span>
                  </div>
                  <p className={`font-body-sm text-sm truncate ${c.unread ? "text-on-surface font-semibold" : "text-secondary"}`}>
                    {c.preview}
                  </p>
                </div>
                {c.unread ? <span className="h-2.5 w-2.5 rounded-full bg-accent-magenta shrink-0" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className={`${!activeId && "hidden"} md:flex flex-1 flex-col h-full bg-surface-container-lowest`}>
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                variant="messages"
                title="Your messages live here."
                body="Razia Sultana Lina will welcome every new rider after admin approval."
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-surface-border">
                <BackButton className="md:hidden" onClick={() => openThread(null)} label="Chats" />
                <Avatar src={active?.avatar} alt={active?.name ?? "Chat"} size={40} />
                <h2 className="font-label-lg text-label-lg">{active?.name || "Conversation"}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-soft-off-white">
                {loadingThread && <p className="font-body-sm text-tertiary">Loading messages…</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"} animate-fade-in-up`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        m.fromMe
                          ? "bg-primary-container text-on-primary-container rounded-br-none"
                          : "bg-surface-container-lowest border border-surface-border rounded-bl-none"
                      }`}
                    >
                      <p className="font-body-md text-sm whitespace-pre-wrap">{m.text}</p>
                      <span className="text-[11px] text-tertiary block mt-1">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-surface-border">
                {sendError ? (
                  <p className="mb-2 text-sm text-error" role="alert">
                    {sendError}
                  </p>
                ) : null}
                <div className="flex items-center gap-2 bg-soft-off-white border border-surface-border rounded-full px-2 py-1">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void send()}
                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none font-body-sm px-2 py-2"
                    placeholder="Type a message..."
                  />
                  <button type="button" onClick={() => void send()} className="p-2 bg-accent-magenta text-white rounded-full">
                    <Icon name="send" size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesRoute() {
  return (
    <Suspense fallback={<p className="p-6 font-body-sm text-tertiary">Loading messages…</p>}>
      <MessagesPage />
    </Suspense>
  );
}
