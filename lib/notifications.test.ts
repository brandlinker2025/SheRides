import assert from "node:assert/strict";
import { test } from "node:test";
import { mapInboxNotification } from "./notification-map";
import { visibleInboxItems } from "./inbox-filter";

test("maps ride alerts and drops social or SOS rows from the same payload", () => {
  const kinds = [
    { kind: "go_accepted", body: "Your SheRides rider is confirmed", href: "/go/ride/1" },
    { kind: "go_request", body: "New SheRides ride request near you", href: "/go?tab=rider" },
    { kind: "go_review", body: "approved your booking access. You can book rides now.", href: "/go" },
    { kind: "partner_review", body: "approved your partner application. SheRides will contact you about next steps.", href: "/partner" },
  ] as const;

  const mapped = kinds.map((kind) =>
    mapInboxNotification({
      id: kind.kind,
      body: kind.body,
      href: kind.href,
      is_read: false,
      created_at: new Date().toISOString(),
      kind: kind.kind,
      actor_id: "actor-1",
      actor_name: "Maya",
      actor_avatar: "/maya.jpg",
    })
  );
  mapped.push(
    mapInboxNotification({
      id: "follow",
      body: "started following you",
      href: "/profile/abc",
      is_read: false,
      created_at: new Date().toISOString(),
      kind: "follow",
      actor_id: "actor-1",
      actor_name: "Maya",
      actor_avatar: "",
    })
  );

  const shown = visibleInboxItems(mapped);
  assert.equal(shown.length, 4);
  assert.equal(shown[0].actor, "Maya");
  assert.equal(shown[0].unread, true);
  assert.equal(shown.every((row) => row.kind !== "follow"), true);
});

test("mark-read mapping treats read and is_read as already seen", () => {
  const fromRead = mapInboxNotification({
    id: "n1",
    body: "Your SheRides rider is confirmed",
    href: "/go/ride/1",
    read: true,
    created_at: "2026-09-05T09:00:00.000Z",
    kind: "go_accepted",
    actor_id: null,
  });
  const fromIsRead = mapInboxNotification({
    id: "n2",
    body: "approved your booking access. You can book rides now.",
    href: "/go",
    is_read: true,
    created_at: "2026-09-05T09:00:00.000Z",
    kind: "go_review",
    actor_id: null,
  });
  assert.equal(fromRead.unread, false);
  assert.equal(fromIsRead.unread, false);
  assert.equal(fromRead.actor, "SheRides");
  assert.equal(fromRead.href, "/go/ride/1");
});
