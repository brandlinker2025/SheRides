"use client";

import { useEffect, useRef } from "react";
import { EmojiPicker } from "@/components/messages/EmojiPicker";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { useConversationThread } from "@/components/messages/useConversationThread";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useUI, type ChatDockItem } from "@/lib/ui-context";

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
  } = useConversationThread(peer.id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (peer.minimized) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading, peer.minimized]);

  return (
    <section
      role="dialog"
      aria-label={`Chat with ${peer.fullName}`}
      className={`w-[328px] flex flex-col overflow-hidden rounded-t-xl border border-b-0 border-surface-border bg-surface-container-lowest shadow-premium ${
        peer.minimized ? "h-12" : "h-[440px]"
      }`}
    >
      <header className="flex items-center gap-1 h-12 px-2 shrink-0 border-b border-surface-border bg-surface-container-lowest">
        <button
          type="button"
          onClick={() => toggleChatDock(peer.id)}
          className="flex-1 flex items-center gap-2 min-w-0 rounded-lg px-1 py-1 hover:bg-surface-container-low text-left"
          aria-label={peer.minimized ? `Expand chat with ${peer.fullName}` : `Minimize chat with ${peer.fullName}`}
        >
          <span className="relative shrink-0">
            <Avatar src={peer.avatar} alt={peer.fullName} size={28} />
            <span
              className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-surface-container-lowest"
              aria-hidden="true"
            />
          </span>
          <span className="font-label-lg text-[13px] text-on-surface truncate">{peer.fullName}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleChatDock(peer.id)}
          className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-high hover:text-on-surface"
          aria-label={peer.minimized ? "Expand" : "Minimize"}
          title={peer.minimized ? "Expand" : "Minimize"}
        >
          <Icon name={peer.minimized ? "expand_less" : "remove"} size={20} />
        </button>
        <button
          type="button"
          onClick={() => closeChatDock(peer.id)}
          className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-high hover:text-on-surface"
          aria-label="Close"
          title="Close"
        >
          <Icon name="close" size={20} />
        </button>
      </header>

      {!peer.minimized ? (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-soft-off-white">
            {loading ? <p className="font-body-sm text-tertiary">Loading messages…</p> : null}
            {error ? (
              <p className="font-body-sm text-error" role="alert">
                {error}
              </p>
            ) : null}
            {!loading && !error && messages.length === 0 ? (
              <p className="font-body-sm text-tertiary">Send a message to start this chat.</p>
            ) : null}
            {user
              ? messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    currentUserId={user.id}
                    barOpen={reactionBarId === m.id}
                    onToggleBar={() => setReactionBarId((id) => (id === m.id ? null : m.id))}
                    onToggleReaction={(emoji) => {
                      void reactTo(m.id, emoji);
                      setReactionBarId(null);
                    }}
                  />
                ))
              : null}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t border-surface-border bg-surface-container-lowest">
            <div className="relative">
              <EmojiPicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={insertEmoji}
                ignoreRef={pandaBtnRef}
              />
              <div className="flex items-center gap-1 bg-soft-off-white border border-surface-border rounded-full px-1 py-0.5">
                <button
                  ref={pandaBtnRef}
                  type="button"
                  onClick={() => setPickerOpen((open) => !open)}
                  className="h-8 w-8 shrink-0 text-base leading-none rounded-full hover:bg-surface-container-high"
                  aria-label="Emoji"
                  aria-expanded={pickerOpen}
                  title="Emoji"
                >
                  🐼
                </button>
                <input
                  ref={draftRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    e.preventDefault();
                    void send();
                  }}
                  dir="auto"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck
                  className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 focus:outline-none font-body-sm text-sm px-1 py-1.5"
                  placeholder="Type a message..."
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  className="p-1.5 bg-accent-magenta text-white rounded-full"
                  aria-label="Send"
                >
                  <Icon name="send" size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
