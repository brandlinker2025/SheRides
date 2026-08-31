"use client";

import { usePathname } from "next/navigation";
import { ChatPopup } from "@/components/messages/ChatPopup";
import { useUI } from "@/lib/ui-context";

export function ChatDock() {
  const { chatDocks } = useUI();
  const pathname = usePathname();

  if (pathname.startsWith("/messages")) return null;
  if (chatDocks.length === 0) return null;

  return (
    <div className="hidden lg:flex pointer-events-none fixed bottom-0 right-4 z-[45] items-end gap-3">
      {chatDocks.map((dock) => (
        <div key={dock.id} className="pointer-events-auto">
          <ChatPopup peer={dock} />
        </div>
      ))}
    </div>
  );
}
