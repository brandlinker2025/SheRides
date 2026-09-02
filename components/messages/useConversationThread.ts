"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatBubbleMessage } from "@/components/messages/MessageBubble";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime } from "@/lib/profile";
import { fetchMessageReactions, openDirectMessage, sendConversationMessage, toggleMessageReaction } from "@/lib/social";
import { createClient } from "@/lib/supabase/client";

function publicAudioUrl(path?: string | null) {
  if (!path) return null;
  return createClient()?.storage.from("message-audio").getPublicUrl(path).data.publicUrl ?? null;
}

function microphoneErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Microphone access is blocked. Tap/click the lock icon beside sherides.online, set Microphone to Allow, then tap the mic again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone was found on this device. Connect or enable a microphone, then try again.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Your microphone is busy in another app. Close the other app using the microphone, then try again.";
  }
  return "SheRides could not start the microphone. Check browser microphone permission and try again.";
}

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
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);
  const draftRef = useRef<HTMLInputElement>(null);
  const pandaBtnRef = useRef<HTMLButtonElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applySeen = useCallback((lastReadAt: string | null) => {
    if (!lastReadAt) return;
    const read = new Date(lastReadAt).getTime();
    setMessages((prev) => prev.map((m) => m.fromMe && m.createdAt && new Date(m.createdAt).getTime() <= read ? { ...m, seen: true } : m));
  }, []);

  useEffect(() => {
    setConversationId(null); setMessages([]); setDraft(""); setError(null); setPickerOpen(false); setReactionBarId(null);
    if (!peerId || !myId) { setLoading(false); return; }
    if (peerId === myId) { setError("You cannot message yourself."); setLoading(false); return; }
    const supabase = createClient(); if (!supabase) { setError("Messaging is not configured."); setLoading(false); return; }
    let cancelled = false; setLoading(true);
    void openDirectMessage(supabase, peerId).then(({ id, error: openError }) => {
      if (cancelled) return;
      if (!id) { setError(openError || "Could not open that conversation."); setLoading(false); return; }
      setConversationId(id);
    });
    return () => { cancelled = true; };
  }, [peerId, myId]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !myId || !conversationId) { if (!conversationId) setMessages([]); return; }
    let cancelled = false; setLoading(true);
    void Promise.all([
      supabase.from("messages").select("id, sender_id, content, audio_path, audio_duration_seconds, created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
      supabase.from("conversation_members").select("user_id, last_read_at").eq("conversation_id", conversationId),
    ]).then(async ([thread, members]) => {
      if (cancelled) return;
      if (thread.error) { setError(thread.error.message); setLoading(false); return; }
      const rows = thread.data ?? [];
      const { rows: reactionRows } = await fetchMessageReactions(supabase, rows.map((row) => row.id as string));
      const peerRead = (members.data ?? []).find((m) => m.user_id !== myId)?.last_read_at as string | null | undefined;
      const readMs = peerRead ? new Date(peerRead).getTime() : 0;
      const reactionsByMessage = new Map<string, ChatBubbleMessage["reactions"]>();
      for (const row of reactionRows) { const list = reactionsByMessage.get(row.message_id) ?? []; list.push({ emoji: row.emoji, userId: row.user_id }); reactionsByMessage.set(row.message_id, list); }
      setMessages(rows.map((row) => ({
        id: row.id as string,
        fromMe: row.sender_id === myId,
        text: (row.content as string) || "",
        audioUrl: publicAudioUrl(row.audio_path as string | null),
        audioDuration: row.audio_duration_seconds as number | null,
        createdAt: row.created_at as string,
        seen: row.sender_id === myId && readMs > 0 && new Date(row.created_at as string).getTime() <= readMs,
        time: formatRelativeTime(row.created_at as string),
        reactions: reactionsByMessage.get(row.id as string) ?? [],
      })));
      setError(null); setLoading(false);
      await supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", myId);
    });

    const channel = supabase.channel(`dock-messages:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const row = payload.new as { id: string; sender_id: string; content?: string; audio_path?: string; audio_duration_seconds?: number; created_at: string };
        setMessages((prev) => prev.some((item) => item.id === row.id) ? prev : [...prev, { id: row.id, fromMe: row.sender_id === myId, text: row.content || "", audioUrl: publicAudioUrl(row.audio_path), audioDuration: row.audio_duration_seconds, createdAt: row.created_at, time: formatRelativeTime(row.created_at), reactions: [] }]);
        if (row.sender_id !== myId) void supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", myId);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_members", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const row = payload.new as { user_id?: string; last_read_at?: string | null };
        if (row.user_id && row.user_id !== myId) applySeen(row.last_read_at ?? null);
      })
      .subscribe();
    return () => { cancelled = true; void supabase.removeChannel(channel); };
  }, [conversationId, myId, applySeen]);

  useEffect(() => { setPickerOpen(false); setReactionBarId(null); }, [conversationId]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  const send = useCallback(async () => {
    const text = draft.trim(); const supabase = createClient(); if (!text || !supabase || !myId || !conversationId) return;
    setError(null); setDraft("");
    const { id, error: insertError } = await sendConversationMessage(supabase, conversationId, myId, text);
    if (!id) { setDraft(text); setError(insertError || "Message could not be sent."); return; }
    const now = new Date().toISOString();
    setMessages((prev) => prev.some((item) => item.id === id) ? prev : [...prev, { id, fromMe: true, text, createdAt: now, time: "Just now", reactions: [] }]);
    setPickerOpen(false);
  }, [draft, myId, conversationId]);

  const startRecording = useCallback(async () => {
    if (!myId || !conversationId || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported on this device/browser.");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); recorderRef.current = recorder; chunksRef.current = []; setRecordSeconds(0);
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const seconds = Math.max(1, recordSeconds); const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (timerRef.current) clearInterval(timerRef.current); stream.getTracks().forEach((t) => t.stop()); setRecording(false); recorderRef.current = null; streamRef.current = null;
        const supabase = createClient(); if (!supabase || !blob.size) return; setSendingVoice(true);
        const ext = recorder.mimeType.includes("mp4") ? "m4a" : recorder.mimeType.includes("ogg") ? "ogg" : "webm";
        const path = `${myId}/${conversationId}/${Date.now()}.${ext}`;
        const upload = await supabase.storage.from("message-audio").upload(path, blob, { contentType: recorder.mimeType || "audio/webm" });
        if (upload.error) { setError(upload.error.message); setSendingVoice(false); return; }
        const inserted = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: myId, content: "", audio_path: path, audio_duration_seconds: seconds }).select("id, created_at").single();
        if (inserted.error) { await supabase.storage.from("message-audio").remove([path]); setError(inserted.error.message); setSendingVoice(false); return; }
        setMessages((prev) => prev.some((m) => m.id === inserted.data.id) ? prev : [...prev, { id: inserted.data.id, fromMe: true, text: "", audioUrl: publicAudioUrl(path), audioDuration: seconds, createdAt: inserted.data.created_at, time: "Just now", reactions: [] }]);
        setSendingVoice(false); setRecordSeconds(0);
      };
      recorder.start(); setRecording(true); timerRef.current = setInterval(() => setRecordSeconds((s) => { if (s >= 179) { recorder.stop(); return 180; } return s + 1; }), 1000);
    } catch (micError) {
      setError(microphoneErrorMessage(micError));
    }
  }, [myId, conversationId, recordSeconds]);

  const stopRecording = useCallback(() => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); }, []);
  const cancelRecording = useCallback(() => { const r = recorderRef.current; if (r) { r.onstop = null; if (r.state === "recording") r.stop(); } if (timerRef.current) clearInterval(timerRef.current); streamRef.current?.getTracks().forEach((t) => t.stop()); chunksRef.current = []; recorderRef.current = null; streamRef.current = null; setRecording(false); setRecordSeconds(0); }, []);

  const insertEmoji = useCallback((emoji: string) => { const el = draftRef.current, start = el?.selectionStart ?? draft.length, end = el?.selectionEnd ?? draft.length; setDraft(draft.slice(0, start) + emoji + draft.slice(end)); requestAnimationFrame(() => el?.focus()); }, [draft]);
  const reactTo = useCallback(async (messageId: string, emoji: string) => { const supabase = createClient(); if (!supabase || !myId) return; const currentlyOn = messages.find((item) => item.id === messageId)?.reactions.some((row) => row.userId === myId && row.emoji === emoji); setMessages((prev) => prev.map((item) => item.id !== messageId ? item : { ...item, reactions: currentlyOn ? item.reactions.filter((row) => !(row.userId === myId && row.emoji === emoji)) : [...item.reactions, { userId: myId, emoji }] })); const reactError = await toggleMessageReaction(supabase, messageId, myId, emoji, Boolean(currentlyOn)); if (reactError) setError(reactError); }, [messages, myId]);

  return { user, conversationId, messages, draft, setDraft, loading, error, send, insertEmoji, reactTo, pickerOpen, setPickerOpen, reactionBarId, setReactionBarId, draftRef, pandaBtnRef, recording, recordSeconds, sendingVoice, startRecording, stopRecording, cancelRecording };
}
