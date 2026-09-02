import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addYears,
  birthdayOccursOn,
  birthdayWishText,
  compareDays,
  dhakaToday,
  dobInputBounds,
  firstNameFromFullName,
  formatDobForAdmin,
  isLeapYear,
  parseDateOnly,
  validateDateOfBirth,
} from "./birthday";
import { dueBirthdayWishes, isApprovedForBirthday } from "./birthday-job";

test("signup without DOB is blocked", () => {
  assert.equal(validateDateOfBirth(""), "Date of birth is required.");
  assert.equal(validateDateOfBirth("   "), "Date of birth is required.");
});

test("future DOB is blocked", () => {
  const today = { year: 2026, month: 9, day: 2 };
  assert.equal(validateDateOfBirth("2026-09-03", today), "Date of birth cannot be in the future.");
  assert.equal(validateDateOfBirth("2099-01-01", today), "Date of birth cannot be in the future.");
});

test("valid DOB is accepted", () => {
  const today = { year: 2026, month: 9, day: 2 };
  assert.equal(validateDateOfBirth("1998-03-15", today), null);
  assert.equal(validateDateOfBirth("2013-09-02", today), null);
});

test("too young or too old is blocked", () => {
  const today = { year: 2026, month: 9, day: 2 };
  assert.equal(validateDateOfBirth("2013-09-03", today), "You must be at least 13 years old.");
  assert.equal(validateDateOfBirth("1925-09-01", today), "Enter a valid date of birth.");
});

test("invalid calendar dates are blocked", () => {
  assert.equal(validateDateOfBirth("2020-02-30", { year: 2026, month: 9, day: 2 }), "Enter a valid date of birth.");
  assert.equal(parseDateOnly("not-a-date"), null);
});

test("existing users with NULL DOB are skipped and do not crash", () => {
  const today = { year: 2026, month: 9, day: 2 };
  const due = dueBirthdayWishes(
    [
      { userId: "a", fullName: "Old Member", dateOfBirth: "", verified: true, role: "rider" },
      { userId: "b", fullName: "Also Old", dateOfBirth: "null", verified: true, role: "rider" },
    ],
    today
  );
  assert.deepEqual(due, []);
});

test("only approved/active users are due a wish", () => {
  const today = { year: 2026, month: 9, day: 2 };
  const birthday = "2000-09-02";
  const due = dueBirthdayWishes(
    [
      { userId: "ok", fullName: "Approved", dateOfBirth: birthday, verified: true, role: "rider" },
      { userId: "admin", fullName: "Admin", dateOfBirth: birthday, verified: false, role: "admin" },
      { userId: "pending", fullName: "Pending", dateOfBirth: birthday, verified: false, role: "rider" },
      { userId: "rejected", fullName: "Rejected", dateOfBirth: birthday, verified: false, role: "rider" },
    ],
    today
  );
  assert.deepEqual(
    due.map((row) => row.userId),
    ["ok", "admin"]
  );
  assert.equal(isApprovedForBirthday({ verified: false, role: "rider" }), false);
});

test("wrong date does not create a wish", () => {
  const today = { year: 2026, month: 9, day: 2 };
  const due = dueBirthdayWishes(
    [{ userId: "x", fullName: "Later", dateOfBirth: "2000-09-03", verified: true, role: "rider" }],
    today
  );
  assert.equal(due.length, 0);
});

test("birthday today is selected once per matching user", () => {
  const today = { year: 2026, month: 9, day: 2 };
  const due = dueBirthdayWishes(
    [
      { userId: "x", fullName: "Today", dateOfBirth: "1999-09-02", verified: true, role: "rider" },
      { userId: "x", fullName: "Today", dateOfBirth: "1999-09-02", verified: true, role: "rider" },
    ],
    today
  );
  assert.equal(due.length, 2);
});

test("Feb 29 is wished on 29 Feb in leap years and 28 Feb otherwise", () => {
  const dob = { year: 2000, month: 2, day: 29 };
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2025), false);
  assert.equal(birthdayOccursOn(dob, { year: 2024, month: 2, day: 29 }), true);
  assert.equal(birthdayOccursOn(dob, { year: 2024, month: 2, day: 28 }), false);
  assert.equal(birthdayOccursOn(dob, { year: 2025, month: 2, day: 28 }), true);
  assert.equal(birthdayOccursOn(dob, { year: 2025, month: 2, day: 27 }), false);
  assert.equal(birthdayOccursOn(dob, { year: 2025, month: 3, day: 1 }), false);
});

test("wish copy uses first name and SheRides family message", () => {
  assert.equal(firstNameFromFullName("Fatima Rahman"), "Fatima");
  const text = birthdayWishText("Fatima Rahman");
  assert.match(text, /^🎉 Happy Birthday, Fatima! 💗/);
  assert.match(text, /The SheRides family wishes you a beautiful, safe and adventurous year ahead/);
  assert.match(text, /Ride • Connect • Empower/);
});

test("admin format does not leak invalid values", () => {
  assert.equal(formatDobForAdmin(null), "—");
  assert.equal(formatDobForAdmin("1998-03-15"), "15 Mar 1998");
});

test("Dhaka calendar helpers stay consistent", () => {
  const today = dhakaToday(new Date("2026-09-02T18:30:00Z"));
  assert.equal(today.year, 2026);
  assert.equal(today.month, 9);
  assert.equal(today.day, 3);
  const bounds = dobInputBounds({ year: 2026, month: 9, day: 2 });
  assert.equal(bounds.max, "2013-09-02");
  assert.equal(compareDays(addYears({ year: 2013, month: 9, day: 2 }, 13), { year: 2026, month: 9, day: 2 }), 0);
});
