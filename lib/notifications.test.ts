import assert from "node:assert/strict";
import { test } from "node:test";
import { mapInboxNotification } from "./notification-map";

test("maps unread message, reaction, comment, and follow alerts", () => {
  const kinds = [
    { kind: "message", body: "sent you a message", href: "/messages?c=1" },
    { kind: "reaction", body: "reacted to your message", href: "/messages?c=1" },
    { kind: "comment", body: "commented on your post", href: "/home?post=1" },
    { kind: "follow", body: "started following you", href: "/profile/abc" },
  ] as const;

  for (const kind of kinds) {
    const item = mapInboxNotification({
      id: kind.kind,
      body: kind.body,
      href: kind.href,
      is_read: false,
      created_at: new Date().toISOString(),
      kind: kind.kind,
      actor_id: "actor-1",
      actor_name: "Maya",
      actor_avatar: "/maya.jpg",
    });
    assert.equal(item.unread, true);
    assert.equal(item.kind, kind.kind);
    assert.equal(item.body, kind.body);
    assert.equal(item.href, kind.href);
    assert.equal(item.actor, "Maya");
  }
});

test("mark-read mapping treats read and is_read as already seen", () => {
  const fromRead = mapInboxNotification({
    id: "n1",
    body: "sent you a message",
    href: "/messages?c=1",
    read: true,
    created_at: "2026-09-05T09:00:00.000Z",
    kind: "message",
    actor_id: null,
  });
  const fromIsRead = mapInboxNotification({
    id: "n2",
    body: "started following you",
    href: "/profile/abc",
    is_read: true,
    created_at: "2026-09-05T09:00:00.000Z",
    kind: "follow",
    actor_id: null,
  });
  assert.equal(fromRead.unread, false);
  assert.equal(fromIsRead.unread, false);
  assert.equal(fromRead.actor, "SheRides");
  assert.equal(fromRead.href, "/messages?c=1");
});
