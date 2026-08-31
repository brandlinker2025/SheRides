"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatBubbleMessage } from "@/components/messages/MessageBubble";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime } from "@/lib/profile";
import {
  fetchMessageReactions,
  openDirectMessage,
  sendConversationMessage,
  toggleMessageReaction,
} from "@/lib/social";
import { createClient } from "@/lib/supabase/client";

export function useConversationThread(peerId: string | null) {
  const { user } = useAuth();
  const myId = user?.id;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(Boolean(peerId));
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reactionBarId, setReactionBarId] = useState<string | null>(null);
  const draftRef = useRef<HTMLInputElement>(null);
  const pandaBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setDraft("");
    setError(null);
    setPickerOpen(false);
    setReactionBarId(null);
    if (!peerId || !myId) {
      setLoading(false);
      return;
    }
    if (peerId === myId) {
      setError("You cannot message yourself.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("Messaging is not configured.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void openDirectMessage(supabase, peerId).then(({ id, error: openError }) => {
      if (cancelled) return;
      if (!id) {
        setError(openError || "Could not open that conversation.");
        setLoading(false);
        return;
      }
      setConversationId(id);
    });
    return () => {
      cancelled = true;
    };
  }, [peerId, myId]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !myId || !conversationId) {
      if (!conversationId) setMessages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(async ({ data, error: threadError }) => {
        if (cancelled) return;
        if (threadError) {
          setError(threadError.message);
          setLoading(false);
          return;
        }
        const rows = data ?? [];
        const { rows: reactionRows } = await fetchMessageReactions(
          supabase,
          rows.map((row) => row.id as string)
        );
        if (cancelled) return;
        const reactionsByMessage = new Map<string, ChatBubbleMessage["reactions"]>();
        for (const row of reactionRows) {
          const list = reactionsByMessage.get(row.message_id) ?? [];
          list.push({ emoji: row.emoji, userId: row.user_id });
          reactionsByMessage.set(row.message_id, list);
        }
        setMessages(
          rows.map((row) => ({
            id: row.id as string,
            fromMe: row.sender_id === myId,
            text: (row.content as string) || "",
            time: formatRelativeTime(row.created_at as string),
            reactions: reactionsByMessage.get(row.id as string) ?? [],
          }))
        );
        setError(null);
        setLoading(false);
        await supabase
          .from("conversation_members")
          .update({ last_read_at: new Date().toISOString() })
          .eq("conversation_id", conversationId)
          .eq("user_id", myId);
      });

    const channel = supabase
      .channel(`dock-messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as { id: string; sender_id: string; content?: string; created_at: string };
          setMessages((prev) => {
            if (prev.some((item) => item.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                fromMe: row.sender_id === myId,
                text: row.content || "",
                time: formatRelativeTime(row.created_at),
                reactions: [],
              },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        (payload) => {
          const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as {
            message_id?: string;
            user_id?: string;
            emoji?: string;
          };
          if (!row.message_id || !row.user_id || !row.emoji) return;
          const messageId = row.message_id;
          const userId = row.user_id;
          const emoji = row.emoji;
          setMessages((prev) => {
            if (!prev.some((item) => item.id === messageId)) return prev;
            return prev.map((item) => {
              if (item.id !== messageId) return item;
              const exists = item.reactions.some((r) => r.userId === userId && r.emoji === emoji);
              if (payload.eventType === "DELETE") {
                return {
                  ...item,
                  reactions: item.reactions.filter((r) => !(r.userId === userId && r.emoji === emoji)),
                };
              }
              if (exists) return item;
              return { ...item, reactions: [...item.reactions, { userId, emoji }] };
            });
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [conversationId, myId]);

  useEffect(() => {
    setPickerOpen(false);
    setReactionBarId(null);
  }, [conversationId]);

  const send = useCallback(async () => {
    const text = draft.trim();
    const supabase = createClient();
    if (!text || !supabase || !myId || !conversationId) return;
    setError(null);
    setDraft("");
    const { id, error: insertError } = await sendConversationMessage(supabase, conversationId, myId, text);
    if (!id) {
      setDraft(text);
      setError(insertError || "Message could not be sent.");
      return;
    }
    setMessages((prev) =>
      prev.some((item) => item.id === id) ? prev : [...prev, { id, fromMe: true, text, time: "Just now", reactions: [] }]
    );
    setPickerOpen(false);
  }, [draft, myId, conversationId]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      const el = draftRef.current;
      const start = el?.selectionStart ?? draft.length;
      const end = el?.selectionEnd ?? draft.length;
      const next = draft.slice(0, start) + emoji + draft.slice(end);
      setDraft(next);
      requestAnimationFrame(() => {
        el?.focus();
        const pos = start + emoji.length;
        el?.setSelectionRange(pos, pos);
      });
    },
    [draft]
  );

  const reactTo = useCallback(
    async (messageId: string, emoji: string) => {
      const supabase = createClient();
      if (!supabase || !myId) return;
      const currentlyOn = messages
        .find((item) => item.id === messageId)
        ?.reactions.some((row) => row.userId === myId && row.emoji === emoji);
      setMessages((prev) =>
        prev.map((item) => {
          if (item.id !== messageId) return item;
          const mine = item.reactions.some((row) => row.userId === myId && row.emoji === emoji);
          return {
            ...item,
            reactions: mine
              ? item.reactions.filter((row) => !(row.userId === myId && row.emoji === emoji))
              : [...item.reactions, { userId: myId, emoji }],
          };
        })
      );
      const reactError = await toggleMessageReaction(supabase, messageId, myId, emoji, Boolean(currentlyOn));
      if (reactError) {
        setError(reactError);
        setMessages((prev) =>
          prev.map((item) => {
            if (item.id !== messageId) return item;
            const mine = item.reactions.some((row) => row.userId === myId && row.emoji === emoji);
            return {
              ...item,
              reactions: mine
                ? item.reactions.filter((row) => !(row.userId === myId && row.emoji === emoji))
                : [...item.reactions, { userId: myId, emoji }],
            };
          })
        );
      }
    },
    [messages, myId]
  );

  return {
    user,
    conversationId,
    messages,
    draft,
    setDraft,
    loading,
    error,
    send,
    insertEmoji,
    reactTo,
    pickerOpen,
    setPickerOpen,
    reactionBarId,
    setReactionBarId,
    draftRef,
    pandaBtnRef,
  };
}
