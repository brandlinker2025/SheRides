"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_CATEGORIES, PANDA_STICKERS } from "@/lib/chat-emoji";

type EmojiPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  ignoreRef?: { current: HTMLElement | null };
};

export function EmojiPicker({ open, onClose, onSelect, ignoreRef }: EmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [categoryId, setCategoryId] = useState(EMOJI_CATEGORIES[0].id);
  const category = EMOJI_CATEGORIES.find((item) => item.id === categoryId) ?? EMOJI_CATEGORIES[0];

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function onPointer(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (ignoreRef?.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose, ignoreRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 right-0 mb-2 z-20 rounded-2xl border border-surface-border bg-surface-container-lowest shadow-premium overflow-hidden"
      role="dialog"
      aria-label="Emoji picker"
    >
      <div className="px-3 pt-3 pb-2 border-b border-surface-border">
        <p className="font-label-lg text-[12px] text-secondary mb-2">Pandas</p>
        <div className="flex gap-0.5 overflow-x-auto pb-1">
          {PANDA_STICKERS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelect(emoji)}
              className="h-9 w-9 shrink-0 text-xl leading-none rounded-lg hover:bg-surface-container-high"
              aria-label={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1 px-2 pt-2 overflow-x-auto">
        {EMOJI_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategoryId(item.id)}
            className={`px-2.5 py-1 rounded-full font-label-lg text-[12px] whitespace-nowrap ${
              categoryId === item.id
                ? "bg-primary-fixed-dim text-on-primary-fixed"
                : "bg-surface-container-high text-secondary hover:text-on-surface"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-0.5 p-2 max-h-52 overflow-y-auto">
        {category.emojis.map((emoji, index) => (
          <button
            key={`${category.id}-${index}-${emoji}`}
            type="button"
            onClick={() => onSelect(emoji)}
            className="h-9 w-full text-xl leading-none rounded-lg hover:bg-surface-container-high"
            aria-label={`Insert ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
