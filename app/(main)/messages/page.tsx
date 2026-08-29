"use client";

import { useState } from "react";
import { chatThread, conversations } from "@/lib/data";
import { img } from "@/lib/images";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const [filter, setFilter] = useState<"All" | "Unread" | "Groups">("All");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const list = conversations.filter((c) => {
    if (filter === "Unread") return c.unread;
    if (filter === "Groups") return c.group;
    return true;
  });

  return (
    <div className="lg:p-6 p-0 max-w-[1600px] mx-auto h-[calc(100dvh-72px)] lg:h-[calc(100dvh-72px)]">
      <div className="flex bg-surface-container-lowest lg:rounded-xl lg:shadow-premium border-y lg:border border-surface-border overflow-hidden w-full h-full">
        <div className={`${activeId && "hidden md:flex"} w-full md:w-[320px] xl:w-[360px] flex-shrink-0 border-r border-surface-border bg-soft-off-white flex flex-col h-full`}>
          <div className="p-4 border-b border-surface-border bg-surface-container-lowest">
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-headline-md text-headline-md text-on-surface">Messages</h1>
              <button type="button" className="p-2 rounded-full hover:bg-surface-container-high text-secondary">
                <Icon name="edit_square" />
              </button>
            </div>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm" size={16} />
              <input
                className="w-full bg-soft-off-white border border-surface-border text-on-surface font-body-sm pl-9 pr-4 py-2 rounded-lg focus:ring-1 focus:ring-accent-magenta focus:border-accent-magenta focus:outline-none"
                placeholder="Search chats..."
              />
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar">
              {(["All", "Unread", "Groups"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 font-label-lg text-[13px] rounded-full whitespace-nowrap ${
                    filter === f ? "bg-primary-fixed-dim text-on-primary-fixed" : "bg-surface-container-high text-secondary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto chat-scroll">
            {list.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full flex items-center gap-3 p-4 text-left border-l-4 transition-colors ${
                  c.id === activeId
                    ? "bg-surface border-accent-magenta"
                    : "border-transparent hover:bg-surface-container-low"
                }`}
              >
                <div className="relative">
                  <Avatar src={c.avatar} initials={c.initials} alt={c.name} size={48} />
                  {c.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-surface rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-label-lg text-label-lg text-on-surface truncate">{c.name}</h3>
                    <span className={`text-[11px] ${c.unread ? "text-accent-magenta font-semibold" : "text-tertiary"}`}>
                      {c.time}
                    </span>
                  </div>
                  <p className="font-body-sm text-sm text-secondary truncate">{c.preview}</p>
                </div>
                {c.unread && <div className="w-2 h-2 rounded-full bg-accent-magenta" />}
              </button>
            ))}
          </div>
        </div>

        <div className={`${!activeId && "hidden"} md:flex flex-1 flex-col h-full bg-surface-container-lowest relative`}>
          <div className="flex justify-between items-center p-4 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <Avatar src={active.avatar} initials={active.initials} alt={active.name} size={40} />
              <div>
                <h2 className="font-label-lg text-label-lg">{active.name}</h2>
                <p className="font-body-sm text-[12px] text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Active now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-secondary">
              <button type="button" className="p-2 rounded-full hover:bg-surface-container-high hover:text-accent-magenta">
                <Icon name="call" />
              </button>
              <button type="button" className="p-2 rounded-full hover:bg-surface-container-high hover:text-accent-magenta">
                <Icon name="videocam" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scroll bg-[#FAFAFA]">
            <div className="flex justify-center">
              <span className="bg-surface-container-high text-secondary font-label-caps text-[10px] px-3 py-1 rounded-full">
                TODAY
              </span>
            </div>
            {chatThread.map((m) =>
              m.fromMe ? (
                <div key={m.id} className="flex flex-col items-end gap-1 max-w-[85%] ml-auto">
                  {m.image ? (
                    <div className="bg-primary-container p-1 rounded-2xl rounded-br-none max-w-sm">
                      <img src={m.image} alt="" className="rounded-xl w-full max-h-48 object-cover" />
                    </div>
                  ) : (
                    <div className="bg-primary-container text-on-primary-container p-3 rounded-2xl rounded-br-none">
                      <p className="font-body-md text-sm">{m.text}</p>
                    </div>
                  )}
                  <span className="text-[11px] text-tertiary mr-1 flex items-center gap-1">
                    {m.time} <Icon name="done_all" size={14} className="text-accent-magenta" />
                  </span>
                </div>
              ) : m.voice ? (
                <div key={m.id} className="flex items-end gap-2 max-w-[85%]">
                  <Avatar src={img.avatarSarah} size={32} />
                  <div className="bg-surface border border-surface-border p-2 pr-4 rounded-2xl rounded-bl-none flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-accent-magenta text-white flex items-center justify-center">
                      <Icon name="play_arrow" size={18} />
                    </span>
                    <span className="text-[10px] text-tertiary">0:14</span>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex items-end gap-2 max-w-[85%]">
                  <Avatar src={img.avatarSarah} size={32} />
                  <div>
                    <div className="bg-surface border border-surface-border p-3 rounded-2xl rounded-bl-none">
                      <p className="font-body-md text-sm">{m.text}</p>
                    </div>
                    <span className="text-[11px] text-tertiary mt-1 block ml-1">{m.time}</span>
                  </div>
                </div>
              )
            )}
            {sent.map((text, i) => (
              <div key={i} className="flex flex-col items-end max-w-[85%] ml-auto">
                <div className="bg-primary-container text-on-primary-container p-3 rounded-2xl rounded-br-none">
                  <p className="font-body-md text-sm">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-surface-border">
            <div className="flex items-center gap-2 bg-soft-off-white border border-surface-border rounded-full px-2 py-1 focus-within:ring-1 focus-within:ring-accent-magenta">
              <Icon name="add_circle" className="text-secondary p-2" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) {
                    setSent((p) => [...p, draft.trim()]);
                    setDraft("");
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none font-body-sm px-2 py-2"
                placeholder="Type a message..."
              />
              <button
                type="button"
                onClick={() => {
                  if (!draft.trim()) return;
                  setSent((p) => [...p, draft.trim()]);
                  setDraft("");
                }}
                className="p-2 bg-accent-magenta text-white rounded-full"
              >
                <Icon name="send" size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="hidden xl:flex w-[320px] flex-shrink-0 border-l border-surface-border bg-soft-off-white flex-col overflow-y-auto">
          <div className="p-6 flex flex-col items-center border-b border-surface-border bg-white">
            <Avatar src={active.avatar} initials={active.initials} alt={active.name} size={96} className="mb-4 ring-4 ring-soft-off-white" />
            <h2 className="font-headline-md text-headline-md mb-1">{active.name}</h2>
            <p className="font-body-sm text-secondary mb-4">Touring Enthusiast • Dhaka</p>
          </div>
          <div className="p-4">
            <h3 className="font-label-lg text-label-lg mb-4">Shared Media</h3>
            <div className="grid grid-cols-3 gap-2">
              {[img.canyon, img.gloves, img.dash].map((src) => (
                <img key={src} src={src} alt="" className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
