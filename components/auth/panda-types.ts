export type PandaMood = "idle" | "look" | "track" | "cover" | "peek" | "sad" | "happy";

export type PandaFocusField = "text" | "password" | null;

export const PANDA_OVERLAY_MOODS: PandaMood[] = ["cover", "peek", "sad", "happy"];

export function isPandaOverlayMood(mood: PandaMood) {
  return PANDA_OVERLAY_MOODS.includes(mood);
}
