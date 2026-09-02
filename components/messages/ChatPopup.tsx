"use client";

import { useEffect, useRef } from "react";
import { EmojiPicker } from "@/components/messages/EmojiPicker";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { useConversationThread } from "@/components/messages/useConversationThread";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useUI, type ChatDockItem } from "@/lib/ui-context";

function fmt(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ChatPopup({ peer }: { peer: ChatDockItem }) {
  const { closeChatDock, toggleChatDock } = useUI();
  const {
    user,
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
    recording,
    recordSeconds,
    sendingVoice,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useConversationThread(peer.id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (peer.minimized) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading, peer.minimized]);

  return (
    <section role="dialog" aria-label={`Chat with ${peer.fullName}`} className={`w-[328px] flex flex-col overflow-hidden rounded-t-xl border border-b-0 border-surface-border bg-surface-container-lowest shadow-premium ${peer.minimized ? "h-12" : "h-[440px]"}`}>
      <header className="flex items-center gap-1 h-12 px-2 shrink-0 border-b border-surface-border bg-surface-container-lowest">
        <button type="button" onClick={() => toggleChatDock(peer.id)} className="flex-1 flex items-center gap-2 min-w-0 rounded-lg px-1 py-1 hover:bg-surface-container-low text-left">
          <span className="relative shrink-0"><Avatar src={peer.avatar} alt={peer.fullName} size={28} /><span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-surface-container-lowest" /></span>
          <span className="font-label-lg text-[13px] text-on-surface truncate">{peer.fullName}</span>
        </button>
        <button type="button" onClick={() => toggleChatDock(peer.id)} className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-high"><Icon name={peer.minimized ? "expand_less" : "remove"} size={20} /></button>
        <button type="button" onClick={() => closeChatDock(peer.id)} className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-high"><Icon name="close" size={20} /></button>
      </header>

      {!peer.minimized ? <>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-soft-off-white">
          {loading ? <p className="font-body-sm text-tertiary">Loading messages…</p> : null}
          {error ? <p className="font-body-sm text-error" role="alert">{error}</p> : null}
          {!loading && !error && messages.length === 0 ? <p className="font-body-sm text-tertiary">Send a message to start this chat.</p> : null}
          {user ? messages.map((m) => <MessageBubble key={m.id} message={m} currentUserId={user.id} barOpen={reactionBarId === m.id} onToggleBar={() => setReactionBarId((id) => id === m.id ? null : m.id)} onToggleReaction={(emoji) => { void reactTo(m.id, emoji); setReactionBarId(null); }} />) : null}
          <div ref={bottomRef} />
        </div>

        <div className="p-2 border-t border-surface-border bg-surface-container-lowest">
          {recording ? (
            <div className="flex items-center gap-2 rounded-full border border-accent-magenta px-2 py-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="flex-1 text-sm font-semibold">Recording {fmt(recordSeconds)}</span>
              <button type="button" onClick={cancelRecording} className="text-xs px-2 py-1">Cancel</button>
              <button type="button" onClick={stopRecording} className="h-8 px-3 rounded-full bg-accent-magenta text-white text-xs font-semibold">Send</button>
            </div>
          ) : (
            <div className="relative">
              <EmojiPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={insertEmoji} ignoreRef={pandaBtnRef} />
              <div className="flex items-center gap-1 bg-soft-off-white border border-surface-border rounded-full px-1 py-0.5">
                <button ref={pandaBtnRef} type="button" onClick={() => setPickerOpen((open) => !open)} className="h-8 w-8 shrink-0 text-base leading-none rounded-full hover:bg-surface-container-high" aria-label="Emoji">🐼</button>
                <input ref={draftRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key !== "Enter") return; if (e.nativeEvent.isComposing || e.keyCode === 229) return; e.preventDefault(); void send(); }} dir="auto" autoCapitalize="off" autoCorrect="off" spellCheck className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 focus:outline-none font-body-sm text-sm px-1 py-1.5" placeholder="Type a message..." />
                {!draft.trim() ? <button type="button" disabled={sendingVoice} onClick={() => void startRecording()} className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-accent-magenta hover:bg-surface-container-high" aria-label="Record voice message" title="Voice message"><Icon name="mic" size={20} /></button> : null}
                <button type="button" onClick={() => void send()} className="p-1.5 bg-accent-magenta text-white rounded-full" aria-label="Send"><Icon name="send" size={18} /></button>
              </div>
              {sendingVoice ? <p className="mt-1 text-[11px] text-tertiary">Sending voice message…</p> : null}
            </div>
          )}
        </div>
      </> : null}
    </section>
  );
}
