"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { goErrorMessage } from "@/lib/go";
import { createClient } from "@/lib/supabase/client";

type RideMessage = { id: string; sender_id: string; body: string; created_at: string };

const QUICK: Record<"rider" | "passenger", string[]> = {
  rider: ["I'm on the way", "I've arrived at the pickup point", "Running about 5 minutes late", "Where exactly are you?"],
  passenger: ["OK, I'm waiting", "I'm at the main gate", "I'm coming out now", "Please wait 2 minutes"],
};

const MAX = 300;

/**
 * Short messages between the passenger and her rider for one ride.
 * `canSend` is true only while the ride is accepted or in progress; afterwards the thread is read-only.
 */
export function RideChat({
  rideId,
  myId,
  role,
  otherName,
  canSend,
}: {
  rideId: string;
  myId: string;
  role: "rider" | "passenger";
  otherName: string;
  canSend: boolean;
}) {
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data, error: loadError } = await supabase
      .from("go_ride_messages")
      .select("id, sender_id, body, created_at")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (loadError) {
      // Table not installed yet: hide the chat instead of showing a broken box.
      if (loadError.code === "PGRST205" || loadError.code === "42P01") setUnavailable(true);
      return;
    }
    setMessages((data ?? []) as RideMessage[]);
  }, [rideId]);

  useEffect(() => {
    void load();
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`go-ride-chat:${rideId}:${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "go_ride_messages", filter: `ride_id=eq.${rideId}` },
        (payload) => {
          const row = payload.new as RideMessage;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();
    // Realtime can drop on weak mobile data; this poll keeps the thread correct.
    const poll = window.setInterval(() => void load(), 8000);
    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [load, rideId]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(body: string) {
    const value = body.trim();
    if (!value || busy) return;
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: sendError } = await supabase.rpc("go_send_ride_message", { p_ride_id: rideId, p_body: value.slice(0, MAX) });
    setBusy(false);
    if (sendError) {
      setError(goErrorMessage(sendError));
      return;
    }
    setText("");
    void load();
  }

  if (unavailable || (!canSend && messages.length === 0)) return null;

  return (
    <section aria-label={`Messages with ${otherName}`} className="card-surface p-5 flex flex-col gap-3">
      <h2 className="font-label-lg flex items-center gap-2">
        <Icon name="chat" className="text-accent-magenta" /> Message {otherName}
      </h2>

      {messages.length > 0 && (
        <div ref={listRef} role="log" aria-live="polite" className="max-h-64 overflow-y-auto flex flex-col gap-2 pr-1">
          {messages.map((m) => {
            const mine = m.sender_id === myId;
            return (
              <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-2 font-body-sm ${mine ? "self-end bg-accent-magenta text-white" : "self-start bg-soft-off-white text-on-surface"}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-[11px] mt-0.5 ${mine ? "text-white/75" : "text-tertiary"}`}>
                  {mine ? "You" : otherName} · {new Date(m.created_at).toLocaleTimeString("en-BD", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {canSend ? (
        <>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {QUICK[role].map((q) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                onClick={() => void send(q)}
                className="h-10 px-4 rounded-full border border-accent-magenta/50 text-accent-magenta font-label-lg text-sm whitespace-nowrap disabled:opacity-60"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(text);
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX}
              placeholder={role === "passenger" ? "e.g. I'm beside the pharmacy, blue scarf" : "Write a message"}
              aria-label={`Message to ${otherName}`}
              className="flex-1 min-w-0 h-12 bg-soft-off-white border border-surface-border rounded-full px-4 font-body-sm"
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              aria-label="Send message"
              className="w-12 h-12 shrink-0 rounded-full bg-accent-magenta text-white inline-flex items-center justify-center disabled:opacity-50"
            >
              <Icon name="send" />
            </button>
          </form>
          {error && <p className="font-body-sm text-error" role="alert">{error}</p>}
        </>
      ) : (
        <p className="font-body-sm text-tertiary">This ride has ended, so messages are closed.</p>
      )}
    </section>
  );
}
