"use client";

import { REACTION_EMOJIS } from "@/lib/chat-emoji";

export type MessageReaction = { emoji: string; userId: string };
export type ChatBubbleMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  reactions: MessageReaction[];
  audioUrl?: string | null;
  audioDuration?: number | null;
  createdAt?: string;
  seen?: boolean;
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
  return [...grouped.values()].sort((a, b) => (order.get(a.emoji) ?? 1000) - (order.get(b.emoji) ?? 1000) || b.count - a.count);
}

export function MessageBubble({ message, currentUserId, barOpen, onToggleBar, onToggleReaction }: {
  message: ChatBubbleMessage;
  currentUserId: string;
  barOpen: boolean;
  onToggleBar: () => void;
  onToggleReaction: (emoji: string) => void;
}) {
  const counts = groupReactions(message.reactions, currentUserId);
  return (
    <div className={`flex ${message.fromMe ? "justify-end" : "justify-start"} animate-fade-in-up`}>
      <div className="group relative max-w-[85%]">
        <div className={`absolute bottom-full mb-1 z-10 flex gap-0.5 px-1 py-1 rounded-full border border-surface-border bg-surface-container-lowest shadow-premium overflow-x-auto ${message.fromMe ? "right-0" : "left-0"} ${barOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"}`}>
          {REACTION_EMOJIS.map((emoji) => (
            <button key={emoji} type="button" onClick={() => onToggleReaction(emoji)} className="h-8 w-8 rounded-full hover:bg-surface-container-high">{emoji}</button>
          ))}
        </div>
        <div onClick={onToggleBar} className={`max-w-full p-3 rounded-2xl cursor-pointer ${message.fromMe ? "bg-primary-container text-on-primary-container rounded-br-none" : "bg-surface-container-lowest border border-surface-border rounded-bl-none"}`}>
          {message.audioUrl ? (
            <div className="min-w-[220px]">
              <div className="flex items-center gap-2 mb-1"><span aria-hidden="true">🎙️</span><span className="text-xs font-semibold">Voice message{message.audioDuration ? ` · ${Math.floor(message.audioDuration / 60)}:${String(message.audioDuration % 60).padStart(2, "0")}` : ""}</span></div>
              <audio controls preload="metadata" src={message.audioUrl} className="w-full h-10" onClick={(e) => e.stopPropagation()} />
            </div>
          ) : null}
          {message.text ? <p className="font-body-md text-sm whitespace-pre-wrap" dir="auto">{message.text}</p> : null}
          <span className="text-[11px] text-tertiary block mt-1">{message.time}</span>
        </div>
        {message.fromMe && message.seen ? <div className="mt-1 text-right text-[11px] font-medium text-accent-magenta">Seen</div> : null}
        {counts.length > 0 ? (
          <div className={`flex flex-wrap gap-1 mt-1 ${message.fromMe ? "justify-end" : "justify-start"}`}>
            {counts.map((item) => (
              <button key={item.emoji} type="button" onClick={() => onToggleReaction(item.emoji)} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[12px] border border-surface-border bg-surface-container-lowest"><span>{item.emoji}</span><span>{item.count}</span></button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
