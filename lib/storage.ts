import type { SupabaseClient } from "@supabase/supabase-js";
import { isVideoFile } from "./media";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 25_000_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<Blob> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const bitmap = await createImageBitmap(file);
  if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
    bitmap.close();
    throw new Error("Image dimensions are too large.");
  }
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not compress image."))), type, quality);
  });
}

export async function uploadPublicImage(
  supabase: SupabaseClient,
  bucket: "avatars" | "posts",
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
) {
  onProgress?.(15);
  const blob = await compressImage(file);
  onProgress?.(45);
  const ext = blob.type === "image/png" ? "png" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  onProgress?.(60);
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  onProgress?.(90);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  onProgress?.(100);
  return data.publicUrl;
}

function videoExtension(file: File) {
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime") return "mov";
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName === "webm" || fromName === "mov" || fromName === "m4v" || fromName === "mp4") return fromName;
  return "mp4";
}

export async function uploadPublicVideo(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
) {
  if (!isVideoFile(file)) {
    throw new Error("Only MP4, WebM, and MOV videos are allowed.");
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Video must be 50 MB or smaller.");
  }
  onProgress?.(20);
  const path = `${userId}/${crypto.randomUUID()}.${videoExtension(file)}`;
  onProgress?.(40);
  const { error } = await supabase.storage.from("posts").upload(path, file, {
    contentType: ALLOWED_VIDEO_TYPES.has(file.type) ? file.type : "video/mp4",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  onProgress?.(90);
  const { data } = supabase.storage.from("posts").getPublicUrl(path);
  onProgress?.(100);
  return data.publicUrl;
}

export async function uploadPublicPostMedia(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
) {
  if (isVideoFile(file)) return uploadPublicVideo(supabase, userId, file, onProgress);
  return uploadPublicImage(supabase, "posts", userId, file, onProgress);
}
