"use client";

import { authFieldClass } from "./AuthScene";

type PhoneOtpFieldsProps = {
  code: string;
  onCodeChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
};

export function PhoneOtpFields({ code, onCodeChange, onFocus, onBlur, disabled }: PhoneOtpFieldsProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-white/70">Verification code</span>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        disabled={disabled}
        onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="6-digit code"
        className={`${authFieldClass} tracking-[0.4em]`}
      />
    </label>
  );
}

export async function postAuthJson(url: string, body: Record<string, string>): Promise<string | null> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let payload: { error?: string } = {};
  try {
    payload = (await response.json()) as { error?: string };
  } catch {
    /* ignore */
  }
  if (!response.ok) return payload.error || "Something went wrong. Please try again.";
  return null;
}
