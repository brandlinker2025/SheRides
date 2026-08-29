"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUI } from "@/lib/ui-context";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

type PostComposerProps = {
  onPost?: (content: string, options?: { image?: File; location?: string; onProgress?: (n: number) => void }) => Promise<string | null> | void;
};

export function PostComposer({ onPost }: PostComposerProps) {
  const { user } = useAuth();
  const { setCreateOpen } = useUI();
  const [value, setValue] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    const text = value.trim();
    if (!text && !image) {
      setCreateOpen(true);
      return;
    }
    setError(null);
    setProgress(0);
    const message = await onPost?.(text, {
      image: image ?? undefined,
      onProgress: setProgress,
    });
    setProgress(null);
    if (message) {
      setError(message);
      return;
    }
    setValue("");
    setImage(null);
    setPreview(null);
  };

  const hasContent = Boolean(value.trim() || image);

  return (
    <div className="card-surface p-6 hover:shadow-premium-hover">
      <div className="flex gap-4 items-center">
        <span className="rounded-full ring-2 ring-accent-magenta/20 shrink-0">
          <Avatar src={user?.avatar} alt={user?.fullName ?? "You"} size={48} />
        </span>
        <input
          className="w-full bg-soft-off-white border border-surface-border rounded-full px-6 py-3 font-body-md text-body-md focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
          placeholder="What's happening on your ride today?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
        />
      </div>
      {preview && (
        <div className="mt-4 relative animate-scale-in">
          <img src={preview} alt="" className="w-full max-h-64 object-cover rounded-xl" />
          <button
            type="button"
            onClick={() => {
              setImage(null);
              setPreview(null);
            }}
            className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-premium hover:scale-110 transition-transform"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      {progress !== null && (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-soft-off-white overflow-hidden">
            <div className="h-full bg-accent-magenta transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="font-body-sm text-tertiary mt-1">Uploading {progress}%</p>
        </div>
      )}
      {error && <p className="mt-2 font-body-sm text-error">{error}</p>}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-surface-border">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-soft-off-white text-secondary hover:text-accent-magenta transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Icon name="image" />
            <span className="font-label-lg text-label-lg hidden sm:inline">Photo</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImage(file);
              setPreview(URL.createObjectURL(file));
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          className={`bg-accent-magenta text-on-primary font-label-lg text-label-lg px-6 py-2 rounded-full hover:bg-primary-container transition-all duration-200 shadow-md hover:shadow-magenta hover:-translate-y-0.5 active:scale-95 ${
            hasContent ? "" : "opacity-60"
          }`}
        >
          Post
        </button>
      </div>
    </div>
  );
}
