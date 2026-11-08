/** Pure helpers for the eKYC selfie camera. No camera hardware and no images. */

export const FACE_TIMER_SECONDS = 3;

export type CameraFailureKind = "blocked" | "denied" | "nocamera" | "busy" | "other";
export type CameraPermission = "granted" | "denied" | "prompt" | "unknown";

export type VideoFrame = {
  readyState: number;
  videoWidth: number;
  videoHeight: number;
};

export type CaptureSession = {
  generation: number;
  busy: boolean;
};

const HAVE_CURRENT_DATA = 2;

export function isUsableVideoFrame(video: VideoFrame | null | undefined): boolean {
  if (!video) return false;
  return video.readyState >= HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0;
}

/** Same mapping the camera screen already shows. Does not request permission. */
export function classifyCameraFailure(name: string, elapsedMs: number, permission: CameraPermission): CameraFailureKind {
  if (name === "NotAllowedError" || name === "SecurityError") {
    const blocked = permission === "denied" || elapsedMs < 450;
    return blocked ? "blocked" : "denied";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") return "nocamera";
  if (name === "NotReadableError") return "busy";
  return "other";
}

export function tickCountdown(current: number): number {
  return current - 1;
}

export function countdownFiresCapture(value: number): boolean {
  return value <= 0;
}

export function createCaptureSession(): CaptureSession {
  return { generation: 0, busy: false };
}

/** Returns the generation token, or null when a capture is already in flight. */
export function beginCapture(session: CaptureSession): number | null {
  if (session.busy) return null;
  session.busy = true;
  session.generation += 1;
  return session.generation;
}

export function isCurrentCapture(session: CaptureSession, generation: number): boolean {
  return session.generation === generation;
}

export function finishCapture(session: CaptureSession, generation: number) {
  if (session.generation !== generation) return;
  session.busy = false;
}

/** Invalidates an in-flight capture. Used on close, retake, and unmount. */
export function cancelCaptureSession(session: CaptureSession) {
  session.generation += 1;
  session.busy = false;
}
