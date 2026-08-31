const VIDEO_URL_RE = /\.(mp4|webm|mov|m4v)(?:\?|#|$)/i;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export function isVideoUrl(url?: string | null) {
  return Boolean(url && VIDEO_URL_RE.test(url));
}

export function isVideoFile(file: File) {
  return ALLOWED_VIDEO_TYPES.has(file.type) || VIDEO_URL_RE.test(file.name);
}
