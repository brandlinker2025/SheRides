import type { SupabaseClient } from "@supabase/supabase-js";

export async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
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
  const path = `${userId}/${Date.now()}.${ext}`;
  onProgress?.(60);
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  onProgress?.(90);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  onProgress?.(100);
  return data.publicUrl;
}
