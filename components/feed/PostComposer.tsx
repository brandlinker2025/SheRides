"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUI } from "@/lib/ui-context";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

type PostComposerProps = {
  onPost?: (content: string) => void;
};

export function PostComposer({ onPost }: PostComposerProps) {
  const { user } = useAuth();
  const { setCreateOpen } = useUI();
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text) {
      setCreateOpen(true);
      return;
    }
    onPost?.(text);
    setValue("");
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-premium p-6">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <Avatar src={user?.avatar} alt={user?.fullName ?? "You"} size={48} className="w-full h-full" />
        </div>
        <input
          className="w-full bg-soft-off-white border border-surface-border rounded-full px-6 py-3 font-body-md text-body-md focus:outline-none focus:border-accent-magenta focus:ring-1 focus:ring-accent-magenta/20 transition-all"
          placeholder="What's happening on your ride today?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-surface-border">
        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-soft-off-white text-secondary hover:text-accent-magenta transition-colors">
            <Icon name="image" />
            <span className="font-label-lg text-label-lg hidden sm:inline">Photo</span>
          </button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-soft-off-white text-secondary hover:text-accent-magenta transition-colors">
            <Icon name="videocam" />
            <span className="font-label-lg text-label-lg hidden sm:inline">Video</span>
          </button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-soft-off-white text-secondary hover:text-accent-magenta transition-colors">
            <Icon name="route" />
            <span className="font-label-lg text-label-lg hidden sm:inline">Route</span>
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          className="bg-accent-magenta text-on-primary font-label-lg text-label-lg px-6 py-2 rounded-full hover:bg-primary-container transition-colors shadow-md"
        >
          Post
        </button>
      </div>
    </div>
  );
}
