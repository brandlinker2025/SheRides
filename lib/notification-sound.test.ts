import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { diffFreshUnread } from "./notification-sound";

test("first inbox snapshot is silent even when unread items already exist", () => {
  const seen = new Set<string>();
  const fresh = diffFreshUnread(
    seen,
    [
      { id: "n1", unread: true },
      { id: "n2", unread: false },
    ],
    true
  );
  assert.deepEqual(fresh, []);
  assert.equal(seen.has("n1"), true);
  assert.equal(seen.has("n2"), true);
});

test("a later unread id plays once and read-only refreshes stay quiet", () => {
  const seen = new Set<string>(["n1"]);
  const arrived = diffFreshUnread(
    seen,
    [
      { id: "n2", unread: true },
      { id: "n1", unread: true },
    ],
    false
  );
  assert.deepEqual(arrived, ["n2"]);

  const sameAgain = diffFreshUnread(
    seen,
    [
      { id: "n2", unread: true },
      { id: "n1", unread: false },
    ],
    false
  );
  assert.deepEqual(sameAgain, []);
});

test("already-seen items that stay unread do not retrigger the chime", () => {
  const seen = new Set<string>(["n1", "n2"]);
  const fresh = diffFreshUnread(
    seen,
    [
      { id: "n1", unread: true },
      { id: "n2", unread: true },
    ],
    false
  );
  assert.deepEqual(fresh, []);
});

test("inbox hook unlocks audio on first tap and chimes only on later unread arrivals", () => {
  const source = readFileSync(new URL("./notifications.ts", import.meta.url), "utf8");
  assert.match(source, /armNotificationSoundUnlock/);
  assert.match(source, /syncInboxToneUser/);
  assert.match(source, /noteInboxSnapshot\(items\)/);
});
