"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ChatDockPeer = {
  id: string;
  fullName: string;
  avatar: string;
};

export type ChatDockItem = ChatDockPeer & { minimized: boolean };

const MAX_DOCKS = 3;

type UIContextValue = {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  chatDocks: ChatDockItem[];
  openChatDock: (peer: ChatDockPeer) => void;
  closeChatDock: (peerId: string) => void;
  toggleChatDock: (peerId: string) => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [chatDocks, setChatDocks] = useState<ChatDockItem[]>([]);

  const openChatDock = useCallback((peer: ChatDockPeer) => {
    if (!peer.id) return;
    setChatDocks((prev) => {
      const rest = prev.filter((item) => item.id !== peer.id);
      const next = [...rest, { id: peer.id, fullName: peer.fullName, avatar: peer.avatar, minimized: false }];
      return next.length > MAX_DOCKS ? next.slice(next.length - MAX_DOCKS) : next;
    });
  }, []);

  const closeChatDock = useCallback((peerId: string) => {
    setChatDocks((prev) => prev.filter((item) => item.id !== peerId));
  }, []);

  const toggleChatDock = useCallback((peerId: string) => {
    setChatDocks((prev) =>
      prev.map((item) => (item.id === peerId ? { ...item, minimized: !item.minimized } : item))
    );
  }, []);

  return (
    <UIContext.Provider
      value={{ createOpen, setCreateOpen, chatDocks, openChatDock, closeChatDock, toggleChatDock }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
