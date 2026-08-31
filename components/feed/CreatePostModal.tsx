"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { isVideoFile } from "@/lib/media";
import { useUI } from "@/lib/ui-context";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

type CreatePostModalProps = {
  onPost?: (
    content: string,
    options?: { image?: File; video?: File; onProgress?: (n: number) => void }
  ) => Promise<string | null> | void;
};

export function CreatePostModal({ onPost }: CreatePostModalProps) {
  const { createOpen, setCreateOpen } = useUI();
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!createOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCreateOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createOpen, setCreateOpen]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!createOpen) return null;

  const hasContent = Boolean(value.trim() || image || video);

  const setMedia = (file: File, kind: "image" | "video") => {
    if (preview) URL.revokeObjectURL(preview);
    if (kind === "video") {
      setVideo(file);
      setImage(null);
    } else {
      setImage(file);
      setVideo(null);
    }
    setPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setVideo(null);
    setPreview(null);
  };

  const submit = async () => {
    if (!value.trim() && !image && !video) return;
    setError(null);
    setProgress(0);
    const message = await onPost?.(value.trim(), {
      image: image ?? undefined,
      video: video ?? undefined,
      onProgress: setProgress,
    });
    setProgress(null);
    if (message) {
      setError(message);
      return;
    }
    setValue("");
    clearMedia();
    setCreateOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-deep-charcoal/40 backdrop-blur-sm p-0 sm:p-6 animate-fade-in">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={() => setCreateOpen(false)}
      />
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-t-xl sm:rounded-xl shadow-premium-hover p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-headline-md">Create a post</h2>
          <button
            type="button"
            onClick={() => setCreateOpen(false)}
            className="text-secondary hover:text-on-surface hover:bg-soft-off-white rounded-full p-1 transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="flex gap-3 mb-4">
          <span className="rounded-full ring-2 ring-accent-magenta/20 shrink-0 h-fit">
            <Avatar src={user?.avatar} alt={user?.fullName ?? ""} size={48} />
          </span>
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
          className="w-full bg-soft-off-white border border-surface-border rounded-xl p-4 font-body-md text-body-md focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300 resize-none"
        />
        {preview && (
          <div className="mt-3 relative animate-scale-in">
            {video ? (
              <video src={preview} controls playsInline className="w-full max-h-56 object-cover rounded-xl" />
            ) : (
              <img src={preview} alt="" className="w-full max-h-56 object-cover rounded-xl" />
            )}
            <button
              type="button"
              onClick={clearMedia}
              className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-premium hover:scale-110 transition-transform"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
        {progress !== null && <p className="mt-2 font-body-sm text-accent-magenta">Uploading {progress}%</p>}
        {error && <p className="mt-2 font-body-sm text-error">{error}</p>}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="text-secondary hover:text-accent-magenta transition-all duration-200 hover:scale-110 active:scale-95 p-1"
              aria-label="Add photo"
            >
              <Icon name="image" />
            </button>
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              className="text-secondary hover:text-accent-magenta transition-all duration-200 hover:scale-110 active:scale-95 p-1"
              aria-label="Add video"
            >
              <Icon name="videocam" />
            </button>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file || isVideoFile(file)) return;
                setMedia(file, "image");
              }}
            />
            <input
              ref={videoRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (!isVideoFile(file)) {
                  setError("Only MP4, WebM, and MOV videos are allowed.");
                  return;
                }
                setError(null);
                setMedia(file, "video");
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            className={`bg-accent-magenta text-white font-label-lg px-6 py-2 rounded-full hover:bg-primary-container transition-all duration-200 shadow-md hover:shadow-magenta active:scale-95 ${
              hasContent ? "" : "opacity-60"
            }`}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
