"use client";

import { REACTION_EMOJIS } from "@/lib/chat-emoji";

export type MessageReaction = {
  emoji: string;
  userId: string;
};

export type ChatBubbleMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  reactions: MessageReaction[];
};

function groupReactions(reactions: MessageReaction[], myId: string) {
  const order = new Map<string, number>(REACTION_EMOJIS.map((emoji, index) => [emoji, index]));
  const grouped = new Map<string, { emoji: string; count: number; mine: boolean }>();
  for (const row of reactions) {
    const current = grouped.get(row.emoji) ?? { emoji: row.emoji, count: 0, mine: false };
    current.count += 1;
    if (row.userId === myId) current.mine = true;
    grouped.set(row.emoji, current);
  }
  return [...grouped.values()].sort((a, b) => {
    const ai = order.get(a.emoji) ?? 1000;
    const bi = order.get(b.emoji) ?? 1000;
    if (ai !== bi) return ai - bi;
    return b.count - a.count;
  });
}

type MessageBubbleProps = {
  message: ChatBubbleMessage;
  currentUserId: string;
  barOpen: boolean;
  onToggleBar: () => void;
  onToggleReaction: (emoji: string) => void;
};

export function MessageBubble({
  message,
  currentUserId,
  barOpen,
  onToggleBar,
  onToggleReaction,
}: MessageBubbleProps) {
  const counts = groupReactions(message.reactions, currentUserId);

  return (
    <div className={`flex ${message.fromMe ? "justify-end" : "justify-start"} animate-fade-in-up`}>
      <div className="group relative max-w-[85%]">
        <div
          className={`absolute bottom-full mb-1 z-10 flex gap-0.5 px-1 py-1 rounded-full border border-surface-border bg-surface-container-lowest shadow-premium overflow-x-auto max-w-[min(100vw-3rem,28rem)] ${
            message.fromMe ? "right-0" : "left-0"
          } ${
            barOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto"
          }`}
          role="toolbar"
          aria-label="Message reactions"
        >
          {REACTION_EMOJIS.map((emoji) => {
            const mine = message.reactions.some((row) => row.userId === currentUserId && row.emoji === emoji);
            return (
              <button
                key={emoji}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleReaction(emoji);
                }}
                className={`h-8 w-8 shrink-0 text-base leading-none rounded-full hover:bg-surface-container-high ${
                  mine ? "bg-primary-fixed-dim/70 ring-1 ring-accent-magenta" : ""
                }`}
                aria-label={`${mine ? "Remove" : "React with"} ${emoji}`}
                aria-pressed={mine}
              >
                {emoji}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onToggleBar}
          className={`w-full text-left max-w-full p-3 rounded-2xl ${
            message.fromMe
              ? "bg-primary-container text-on-primary-container rounded-br-none"
              : "bg-surface-container-lowest border border-surface-border rounded-bl-none"
          }`}
        >
          <p className="font-body-md text-sm whitespace-pre-wrap" dir="auto">
            {message.text}
          </p>
          <span className="text-[11px] text-tertiary block mt-1">{message.time}</span>
        </button>
        {counts.length > 0 ? (
          <div className={`flex flex-wrap gap-1 mt-1 ${message.fromMe ? "justify-end" : "justify-start"}`}>
            {counts.map((item) => (
              <button
                key={item.emoji}
                type="button"
                onClick={() => onToggleReaction(item.emoji)}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[12px] border ${
                  item.mine
                    ? "border-accent-magenta bg-primary-fixed-dim/40 text-on-surface"
                    : "border-surface-border bg-surface-container-lowest text-secondary"
                }`}
                aria-label={`${item.emoji} ${item.count}${item.mine ? ", yours" : ""}`}
                aria-pressed={item.mine}
              >
                <span>{item.emoji}</span>
                <span>{item.count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
