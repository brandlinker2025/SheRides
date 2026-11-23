import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { hashOtpCode, MAX_ATTEMPTS } from "./otp";
import { checkServerOtp, serverResendWaitMs, storeServerOtp } from "./otp-store";

// The pepper is read on each call, so setting it here (after imports) is enough.
process.env.SMS_NET_BD_API_KEY = "test-secret";

type Row = Record<string, unknown>;

/** Tiny in-memory stand-in for the slice of the Supabase query builder these helpers use. */
function fakeAdmin(rows: Row[]) {
  function query() {
    const filters: ((r: Row) => boolean)[] = [];
    let patch: Row | null = null;
    let insert: Row | null = null;
    let order: { col: string; asc: boolean } | null = null;
    let limit = Infinity;
    const run = () => {
      if (insert) {
        rows.push({ id: String(rows.length + 1), attempts: 0, consumed_at: null, created_at: new Date().toISOString(), ...insert });
        return { data: null, error: null };
      }
      let hit = rows.filter((r) => filters.every((f) => f(r)));
      if (patch) {
        hit.forEach((r) => Object.assign(r, patch));
        return { data: hit.map((r) => ({ id: r.id })), error: null };
      }
      if (order) {
        const { col, asc } = order;
        hit = [...hit].sort((a, b) => String(a[col]).localeCompare(String(b[col])) * (asc ? 1 : -1));
      }
      return { data: hit.slice(0, limit), error: null };
    };
    const q = {
      select: () => q,
      update: (p: Row) => ((patch = p), q),
      insert: (p: Row) => ((insert = p), q),
      eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), q),
      is: (c: string, v: unknown) => (filters.push((r) => (r[c] ?? null) === v), q),
      gte: (c: string, v: string) => (filters.push((r) => String(r[c]) >= v), q),
      order: (col: string, o: { ascending: boolean }) => ((order = { col, asc: o.ascending }), q),
      limit: (n: number) => ((limit = n), q),
      maybeSingle: async () => {
        const { data } = run();
        return { data: (data as Row[])[0] ?? null, error: null };
      },
      then: (resolve: (v: unknown) => void) => resolve(run()),
    };
    return q;
  }
  return { from: () => query() } as unknown as SupabaseClient;
}

const phone = "8801711111111";

test("OTP hash is keyed, so a leaked cookie hash cannot be brute-forced offline", async () => {
  const hash = await hashOtpCode(phone, "reset", "123456");
  const plain = createHash("sha256").update(`reset:${phone}:123456`).digest("hex");
  assert.notEqual(hash, plain);
  process.env.SMS_NET_BD_API_KEY = "other-secret";
  assert.notEqual(await hashOtpCode(phone, "reset", "123456"), hash);
  process.env.SMS_NET_BD_API_KEY = "test-secret";
});

test("attempt limit is enforced in the database, not the replayable cookie", async () => {
  const rows: Row[] = [];
  const admin = fakeAdmin(rows);
  await storeServerOtp(admin, phone, "reset", await hashOtpCode(phone, "reset", "111111"), new Date(Date.now() + 60_000));
  const wrong = await hashOtpCode(phone, "reset", "999999");
  for (let i = 1; i < MAX_ATTEMPTS; i++) assert.equal(await checkServerOtp(admin, phone, "reset", wrong), "invalid");
  assert.equal(await checkServerOtp(admin, phone, "reset", wrong), "locked");
  // Even the right code is refused once locked.
  assert.equal(await checkServerOtp(admin, phone, "reset", await hashOtpCode(phone, "reset", "111111")), "locked");
});

test("a correct code works once and cannot be reused", async () => {
  const rows: Row[] = [];
  const admin = fakeAdmin(rows);
  const good = await hashOtpCode(phone, "reset", "222222");
  await storeServerOtp(admin, phone, "reset", good, new Date(Date.now() + 60_000));
  assert.equal(await checkServerOtp(admin, phone, "reset", good), "ok");
  assert.equal(await checkServerOtp(admin, phone, "reset", good), "invalid");
});

test("expired codes are rejected", async () => {
  const rows: Row[] = [];
  const admin = fakeAdmin(rows);
  const good = await hashOtpCode(phone, "reset", "333333");
  await storeServerOtp(admin, phone, "reset", good, new Date(Date.now() - 1));
  assert.equal(await checkServerOtp(admin, phone, "reset", good), "invalid");
});

test("resend wait is enforced per number even without a cookie", async () => {
  const rows: Row[] = [];
  const admin = fakeAdmin(rows);
  assert.equal(await serverResendWaitMs(admin, phone), 0);
  await storeServerOtp(admin, phone, "reset", "h", new Date(Date.now() + 60_000));
  assert.ok((await serverResendWaitMs(admin, phone)) > 0);
});
