"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime } from "@/lib/profile";
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

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<"All" | "Unread">("All");

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("c");
    if (fromQuery) setActiveId(fromQuery);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user) return;

    const load = async () => {
      const { data: memberships } = await supabase
        .from("conversation_members")
        .select("conversation_id, conversations(id, updated_at, is_group, title)")
        .eq("user_id", user.id);
      const ids = (memberships ?? []).map((row) => row.conversation_id as string);
      if (!ids.length) {
        setConversations([]);
        return;
      }
      const { data: members } = await supabase
        .from("conversation_members")
        .select("conversation_id, user_id, profiles(full_name, avatar_url)")
        .in("conversation_id", ids);
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("id, conversation_id, content, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false });

      const items: ConversationItem[] = ids.map((id) => {
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
          unread: false,
        };
      });
      setConversations(items);
      if (!activeId && items[0]) setActiveId(items[0].id);
    };

    void load();
  }, [user, activeId]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user || !activeId) return;
    void supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(
          (data ?? []).map((row) => ({
            id: row.id as string,
            fromMe: row.sender_id === user.id,
            text: (row.content as string) || "",
            time: formatRelativeTime(row.created_at as string),
          }))
        );
      });
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
    setDraft("");
    const { data } = await supabase
      .from("messages")
      .insert({ conversation_id: activeId, sender_id: user.id, content: text })
      .select("id, created_at")
      .single();
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeId);
    setMessages((prev) => [
      ...prev,
      { id: (data?.id as string) || `local-${Date.now()}`, fromMe: true, text, time: "Just now" },
    ]);
    setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, preview: text, time: "Just now" } : c)));
  }

  return (
    <div className="lg:p-6 p-0 max-w-[1600px] mx-auto h-[calc(100dvh-72px)]">
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
            {list.length === 0 && (
              <p className="p-6 font-body-sm text-tertiary">No conversations yet. New members get a welcome from Razia.</p>
            )}
            {list.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
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
                  <p className="font-body-sm text-sm text-secondary truncate">{c.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`${!activeId && "hidden"} md:flex flex-1 flex-col h-full bg-surface-container-lowest`}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                variant="messages"
                title="Your messages live here."
                body="Razia Sultana Lina will welcome every new rider."
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-surface-border">
                <Avatar src={active.avatar} alt={active.name} size={40} />
                <h2 className="font-label-lg text-label-lg">{active.name}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-soft-off-white">
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
