"use client";

import { stories } from "@/lib/data";
import { Icon } from "../ui/Icon";

export function StoriesRow() {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-premium p-4 flex gap-4 overflow-x-auto snap-x hide-scrollbar">
      <div className="flex flex-col items-center gap-2 snap-start flex-shrink-0 cursor-pointer group">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-surface-dim flex items-center justify-center bg-soft-off-white group-hover:border-accent-magenta transition-colors">
          <Icon name="add" className="text-accent-magenta" />
        </div>
        <span className="font-label-caps text-label-caps text-secondary">You</span>
      </div>
      {stories.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-2 snap-start flex-shrink-0 cursor-pointer">
          <div
            className={`w-16 h-16 rounded-full p-[2px] ${
              story.viewed ? "bg-surface-variant" : "bg-gradient-to-tr from-accent-magenta to-primary-container"
            }`}
          >
            <div className="w-full h-full rounded-full border-2 border-surface-container-lowest overflow-hidden">
              <img
                src={story.avatar}
                alt={story.name}
                className={`w-full h-full object-cover ${story.viewed ? "opacity-80" : ""}`}
              />
            </div>
          </div>
          <span className={`font-label-caps text-label-caps ${story.viewed ? "text-secondary" : "text-on-surface"}`}>
            {story.name}
          </span>
        </div>
      ))}
    </div>
  );
}
