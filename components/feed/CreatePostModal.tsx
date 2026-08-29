"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUI } from "@/lib/ui-context";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

type CreatePostModalProps = {
  onPost?: (content: string, options?: { image?: File; onProgress?: (n: number) => void }) => Promise<string | null> | void;
};

export function CreatePostModal({ onPost }: CreatePostModalProps) {
  const { createOpen, setCreateOpen } = useUI();
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!createOpen) return null;

  const submit = async () => {
    if (!value.trim() && !image) return;
    setError(null);
    setProgress(0);
    const message = await onPost?.(value.trim(), { image: image ?? undefined, onProgress: setProgress });
    setProgress(null);
    if (message) {
      setError(message);
      return;
    }
    setValue("");
    setImage(null);
    setPreview(null);
    setCreateOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-deep-charcoal/40 p-0 sm:p-6">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={() => setCreateOpen(false)}
      />
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-t-xl sm:rounded-xl shadow-premium-hover p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-headline-md">Create a post</h2>
          <button type="button" onClick={() => setCreateOpen(false)} className="text-secondary hover:text-on-surface">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex gap-3 mb-4">
          <Avatar src={user?.avatar} alt={user?.fullName ?? ""} size={48} />
          <div>
            <p className="font-label-lg text-label-lg">{user?.fullName}</p>
            <p className="font-body-sm text-body-sm text-tertiary">Sharing with SheRides</p>
          </div>
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={5}
          placeholder="What's happening on your ride today?"
          className="w-full bg-soft-off-white border border-surface-border rounded-xl p-4 font-body-md text-body-md focus:outline-none focus:border-accent-magenta resize-none"
        />
        {preview && <img src={preview} alt="" className="mt-3 w-full max-h-56 object-cover rounded-xl" />}
        {progress !== null && <p className="mt-2 font-body-sm text-accent-magenta">Uploading {progress}%</p>}
        {error && <p className="mt-2 font-body-sm text-error">{error}</p>}
        <div className="flex justify-between items-center mt-4">
          <button type="button" onClick={() => inputRef.current?.click()} className="text-secondary hover:text-accent-magenta">
            <Icon name="image" />
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
          <button
            type="button"
            onClick={() => void submit()}
            className="bg-accent-magenta text-white font-label-lg px-6 py-2 rounded-full hover:bg-primary-container"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
