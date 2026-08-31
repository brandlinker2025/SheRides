const OTP_COOKIE = "sr_otp";
const VERIFIED_COOKIE = "sr_pv";
const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFIED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "signup" | "reset";

type OtpPayload = {
  p: string;
  u: OtpPurpose;
  h: string;
  e: number;
  a: number;
  s: number;
};

type VerifiedPayload = {
  u: string;
  p: string;
  e: number;
};

export const otpCookieName = OTP_COOKIE;
export const verifiedCookieName = VERIFIED_COOKIE;

export function otpPepper(): string | null {
  return process.env.SMS_NET_BD_API_KEY?.trim() || null;
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view, (b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of view) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSha256(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return bytesToBase64Url(sig);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(digest);
}

export function generateOtpCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}

export async function hashOtpCode(phone: string, purpose: OtpPurpose, code: string): Promise<string> {
  return sha256Hex(`${purpose}:${phone}:${code.trim()}`);
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function seal(payload: object, key: string): Promise<string> {
  const body = JSON.stringify(payload);
  const sig = await hmacSha256(key, body);
  return `${bytesToBase64Url(new TextEncoder().encode(body))}.${sig}`;
}

async function open<T>(token: string | undefined, key: string): Promise<T | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const bodyB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let body: string;
  try {
    body = new TextDecoder().decode(base64UrlToBytes(bodyB64));
  } catch {
    return null;
  }
  const expected = await hmacSha256(key, body);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

export async function sealOtpCookie(input: {
  phone: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts?: number;
  expiresAt?: number;
  sentAt?: number;
}): Promise<{ value: string; maxAge: number }> {
  const key = otpPepper();
  if (!key) throw new Error("SMS is not configured.");
  const now = Date.now();
  const expiresAt = input.expiresAt ?? now + OTP_TTL_MS;
  const value = await seal(
    {
      p: input.phone,
      u: input.purpose,
      h: input.codeHash,
      e: expiresAt,
      a: input.attempts ?? 0,
      s: input.sentAt ?? now,
    } satisfies OtpPayload,
    key
  );
  return { value, maxAge: Math.max(1, Math.ceil((expiresAt - now) / 1000)) };
}

export async function readOtpCookie(token: string | undefined): Promise<OtpPayload | null> {
  const key = otpPepper();
  if (!key) return null;
  const payload = await open<OtpPayload>(token, key);
  if (!payload?.p || !payload.h || (payload.u !== "signup" && payload.u !== "reset")) return null;
  if (payload.e < Date.now()) return null;
  return payload;
}

export function otpResendWaitMs(payload: OtpPayload | null): number {
  if (!payload) return 0;
  const wait = 60_000 - (Date.now() - payload.s);
  return wait > 0 ? wait : 0;
}

export function otpAttemptsLeft(payload: OtpPayload): number {
  return Math.max(0, MAX_ATTEMPTS - payload.a);
}

export async function sealVerifiedCookie(userId: string, phone: string): Promise<{ value: string; maxAge: number }> {
  const key = otpPepper();
  if (!key) throw new Error("SMS is not configured.");
  const value = await seal(
    { u: userId, p: phone, e: Date.now() + VERIFIED_TTL_MS } satisfies VerifiedPayload,
    key
  );
  return { value, maxAge: Math.ceil(VERIFIED_TTL_MS / 1000) };
}

export async function hasVerifiedPhoneCookie(
  token: string | undefined,
  userId: string,
  phone: string
): Promise<boolean> {
  const key = otpPepper();
  if (!key) return false;
  const payload = await open<VerifiedPayload>(token, key);
  if (!payload) return false;
  if (payload.e < Date.now()) return false;
  return payload.u === userId && payload.p === phone;
}

export const otpCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
