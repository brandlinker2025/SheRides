"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { isVideoFile } from "@/lib/media";
import { useUI } from "@/lib/ui-context";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

type PostComposerProps = {
  onPost?: (
    content: string,
    options?: { image?: File; video?: File; location?: string; onProgress?: (n: number) => void }
  ) => Promise<string | null> | void;
};

export function PostComposer({ onPost }: PostComposerProps) {
  const { user } = useAuth();
  const { setCreateOpen } = useUI();
  const [value, setValue] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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
    const text = value.trim();
    if (!text && !image && !video) {
      setCreateOpen(true);
      return;
    }
    setError(null);
    setProgress(0);
    const message = await onPost?.(text, {
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
  };

  const hasContent = Boolean(value.trim() || image || video);

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
          {video ? (
            <video src={preview} controls playsInline className="w-full max-h-64 object-cover rounded-xl" />
          ) : (
            <img src={preview} alt="" className="w-full max-h-64 object-cover rounded-xl" />
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
            onClick={() => imageRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-soft-off-white text-secondary hover:text-accent-magenta transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Icon name="image" />
            <span className="font-label-lg text-label-lg hidden sm:inline">Photo</span>
          </button>
          <button
            type="button"
            onClick={() => videoRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-soft-off-white text-secondary hover:text-accent-magenta transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Icon name="videocam" />
            <span className="font-label-lg text-label-lg hidden sm:inline">Video</span>
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
