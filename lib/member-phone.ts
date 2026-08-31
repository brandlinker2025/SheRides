import { hasVerifiedPhoneCookie, verifiedCookieName } from "./otp";

type PhoneRow = {
  phone: string;
  verified_at: string | null;
};

export async function getMemberPhoneRow(
  supabase: { from: (table: string) => unknown },
  userId: string
): Promise<PhoneRow | null> {
  try {
    const query = supabase.from("member_phones") as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: PhoneRow | null; error: { message?: string } | null }>;
        };
      };
    };
    const { data, error } = await query.select("phone, verified_at").eq("user_id", userId).maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function memberNeedsPhoneOtp(
  supabase: { from: (table: string) => unknown },
  userId: string,
  verifiedCookie: string | undefined
): Promise<boolean> {
  const row = await getMemberPhoneRow(supabase, userId);
  if (!row || row.verified_at) return false;
  if (await hasVerifiedPhoneCookie(verifiedCookie, userId, row.phone)) return false;
  return true;
}

export { verifiedCookieName };
