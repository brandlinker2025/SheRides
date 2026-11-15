/** Birthday wishes use the civil calendar in Asia/Dhaka (Bangladesh, UTC+6, no DST). */

export const BIRTHDAY_TIMEZONE = "Asia/Dhaka";
export const MIN_AGE_YEARS = 13;
export const MAX_AGE_YEARS = 100;

export type CalendarDay = {
  year: number;
  month: number;
  day: number;
};

/**
 * Feb 29 birthdays:
 * - On leap years, wish on 29 February.
 * - On non-leap years, wish on 28 February.
 */
export function isLeapYear(year: number) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function parseDateOnly(value: string): CalendarDay | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

export function formatDateOnly(day: CalendarDay) {
  return `${String(day.year).padStart(4, "0")}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
}

export function addYears(day: CalendarDay, years: number): CalendarDay {
  const year = day.year + years;
  if (day.month === 2 && day.day === 29 && !isLeapYear(year)) {
    return { year, month: 2, day: 28 };
  }
  return { year, month: day.month, day: day.day };
}

export function compareDays(a: CalendarDay, b: CalendarDay) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function dhakaToday(now = new Date()): CalendarDay {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BIRTHDAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return { year, month, day };
}

export function validateDateOfBirth(value: string, today = dhakaToday()): string | null {
  if (!value.trim()) return "Date of birth is required.";
  const dob = parseDateOnly(value);
  if (!dob) return "Enter a valid date of birth.";
  if (compareDays(dob, today) > 0) return "Date of birth cannot be in the future.";
  if (compareDays(dob, addYears(today, -MIN_AGE_YEARS)) > 0) {
    return `You must be at least ${MIN_AGE_YEARS} years old.`;
  }
  if (compareDays(dob, addYears(today, -MAX_AGE_YEARS)) < 0) {
    return "Enter a valid date of birth.";
  }
  return null;
}

export function dobInputBounds(today = dhakaToday()) {
  return {
    min: formatDateOnly(addYears(today, -MAX_AGE_YEARS)),
    max: formatDateOnly(addYears(today, -MIN_AGE_YEARS)),
  };
}

export function birthdayOccursOn(dob: CalendarDay, today: CalendarDay) {
  if (dob.month === 2 && dob.day === 29) {
    if (isLeapYear(today.year)) return today.month === 2 && today.day === 29;
    return today.month === 2 && today.day === 28;
  }
  return dob.month === today.month && dob.day === today.day;
}

export function firstNameFromFullName(fullName: string) {
  const first = fullName.trim().split(/\s+/).find(Boolean);
  return first || "Rider";
}

export function birthdayWishText(fullName: string) {
  const first = firstNameFromFullName(fullName);
  return [
    `🎉 Happy Birthday, ${first}! 💗`,
    "The SheRides family wishes you a beautiful, safe and adventurous year ahead.",
    "Ride • Connect • Empower.",
  ].join("\n");
}

export function formatDobForAdmin(value: string | null | undefined) {
  if (!value) return "—";
  const day = parseDateOnly(value.slice(0, 10));
  if (!day) return "—";
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
