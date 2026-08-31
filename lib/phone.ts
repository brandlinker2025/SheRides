export const PHONE_AUTH_EMAIL_DOMAIN = "phone.sherides.online";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 01XXXXXXXXX, +8801XXXXXXXXX, or 8801XXXXXXXXX → 8801XXXXXXXXX */
export function normalizeBdPhone(input: string): string | null {
  const raw = input.trim().replace(/[\s-]/g, "");
  if (/^01\d{9}$/.test(raw)) return `88${raw}`;
  if (/^\+8801\d{9}$/.test(raw)) return raw.slice(1);
  if (/^8801\d{9}$/.test(raw)) return raw;
  return null;
}

export function isEmailIdentifier(input: string): boolean {
  return EMAIL_PATTERN.test(input.trim());
}

export function phoneAuthEmail(normalizedPhone: string): string {
  return `${normalizedPhone}@${PHONE_AUTH_EMAIL_DOMAIN}`;
}

export function isPhoneAuthEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith(`@${PHONE_AUTH_EMAIL_DOMAIN}`));
}

export type MemberIdentifier =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string };

/** Login accepts a BD mobile or a legacy email. Signup is phone-only. */
export function parseMemberIdentifier(input: string): MemberIdentifier | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isEmailIdentifier(trimmed)) return { kind: "email", value: trimmed };
  const phone = normalizeBdPhone(trimmed);
  if (phone) return { kind: "phone", value: phone };
  return null;
}

export function authEmailForIdentifier(identifier: MemberIdentifier): string {
  return identifier.kind === "phone" ? phoneAuthEmail(identifier.value) : identifier.value;
}

export function formatBdPhoneDisplay(normalized: string): string {
  if (normalized.startsWith("880") && normalized.length === 13) {
    return `+${normalized}`;
  }
  return normalized;
}
