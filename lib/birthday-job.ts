import type { SupabaseClient } from "@supabase/supabase-js";
import {
  birthdayOccursOn,
  birthdayWishText,
  dhakaToday,
  parseDateOnly,
  type CalendarDay,
} from "./birthday";

export type BirthdayCandidate = {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  verified: boolean;
  role: string;
};

export function isApprovedForBirthday(candidate: Pick<BirthdayCandidate, "verified" | "role">) {
  return candidate.role === "admin" || candidate.verified === true;
}

export function dueBirthdayWishes(candidates: BirthdayCandidate[], today: CalendarDay) {
  return candidates.filter((candidate) => {
    if (!isApprovedForBirthday(candidate)) return false;
    const dob = parseDateOnly(candidate.dateOfBirth.slice(0, 10));
    return Boolean(dob && birthdayOccursOn(dob, today));
  });
}

type WishRow = {
  user_id: string;
  date_of_birth: string;
  profiles:
    | { full_name: string | null; verified: boolean | null; role: string | null }
    | { full_name: string | null; verified: boolean | null; role: string | null }[]
    | null;
};

function profileFromEmbed(row: WishRow) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    userId: row.user_id,
    fullName: profile?.full_name || "Rider",
    dateOfBirth: row.date_of_birth,
    verified: Boolean(profile?.verified),
    role: profile?.role === "admin" ? "admin" : "rider",
  } satisfies BirthdayCandidate;
}

export async function runBirthdayWishes(
  supabase: SupabaseClient,
  today = dhakaToday()
): Promise<{ sent: number; skipped: number; failed: number; year: number }> {
  const { data, error } = await supabase.from("member_birthdays").select(
    "user_id, date_of_birth, profiles!inner(full_name, verified, role)"
  );
  if (error) throw new Error("Could not load birthday records.");

  const due = dueBirthdayWishes((data ?? []).map((row) => profileFromEmbed(row as WishRow)), today);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of due) {
    try {
      const { data: delivered, error: deliverError } = await supabase.rpc("deliver_birthday_wish", {
        p_user_id: candidate.userId,
        p_year: today.year,
        p_body: birthdayWishText(candidate.fullName),
        p_href: "/home",
      });
      if (deliverError) {
        failed += 1;
        continue;
      }
      if (delivered) sent += 1;
      else skipped += 1;
    } catch {
      failed += 1;
    }
  }

  return { sent, skipped, failed, year: today.year };
}
