type InboxToneItem = { id: string; unread: boolean };

const seenIds = new Set<string>();
let primed = false;
let sessionUserId: string | null = null;
let pendingPlay = false;
let lastPlayAt = 0;
let unlockBound = false;
let audioContext: AudioContext | null = null;

const COOLDOWN_MS = 1400;

type WebkitAudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function diffFreshUnread(
  seen: Set<string>,
  items: ReadonlyArray<InboxToneItem>,
  isFirstSnapshot: boolean
): string[] {
  const fresh = isFirstSnapshot
    ? []
    : items.filter((item) => item.unread && !seen.has(item.id)).map((item) => item.id);
  for (const item of items) seen.add(item.id);
  return fresh;
}

export function syncInboxToneUser(userId: string | null) {
  if (userId === sessionUserId) return;
  sessionUserId = userId;
  seenIds.clear();
  primed = false;
  pendingPlay = false;
}

export function armNotificationSoundUnlock() {
  if (unlockBound || typeof window === "undefined") return;
  unlockBound = true;
  const unlock = () => {
    void unlockFromGesture();
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  window.addEventListener("touchstart", unlock, { passive: true });
}

export function noteInboxSnapshot(items: ReadonlyArray<InboxToneItem>) {
  if (typeof window === "undefined") return;
  armNotificationSoundUnlock();
  const fresh = diffFreshUnread(seenIds, items, !primed);
  primed = true;
  if (fresh.length) playNotificationTung();
}

export function playNotificationTung() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastPlayAt < COOLDOWN_MS) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state !== "running") {
    pendingPlay = true;
    void ctx.resume().then(() => {
      if (ctx.state === "running" && pendingPlay) {
        pendingPlay = false;
        startTung(ctx);
      }
    });
    return;
  }

  startTung(ctx);
}

function getAudioContext() {
  if (audioContext) return audioContext;
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  return audioContext;
}

async function unlockFromGesture() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const tick = ctx.createBufferSource();
    tick.buffer = buffer;
    tick.connect(ctx.destination);
    tick.start(0);
    if (pendingPlay && ctx.state === "running") {
      pendingPlay = false;
      startTung(ctx);
    }
  } catch {
    /* Autoplay can stay locked until the next gesture. */
  }
}

function startTung(ctx: AudioContext) {
  const at = Date.now();
  if (at - lastPlayAt < COOLDOWN_MS) return;
  lastPlayAt = at;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.14, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
  master.connect(ctx.destination);

  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(784, now);
  body.frequency.exponentialRampToValueAtTime(494, now + 0.2);
  body.connect(master);

  const click = ctx.createOscillator();
  click.type = "triangle";
  click.frequency.setValueAtTime(1174, now);
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.0001, now);
  clickGain.gain.exponentialRampToValueAtTime(0.045, now + 0.008);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  click.connect(clickGain);
  clickGain.connect(ctx.destination);

  body.start(now);
  click.start(now);
  body.stop(now + 0.28);
  click.stop(now + 0.1);
}
