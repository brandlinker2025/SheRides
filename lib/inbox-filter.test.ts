import assert from "node:assert/strict";
import { test } from "node:test";
import { isRideNotification, rideNotificationHref, visibleInboxItems } from "./inbox-filter";
import type { InboxNotification } from "./notification-map";

function item(partial: Partial<InboxNotification>): InboxNotification {
  return {
    id: partial.id ?? "1",
    actor: partial.actor ?? "Maya",
    actorId: partial.actorId ?? "a",
    avatar: "",
    body: partial.body ?? "",
    time: "now",
    unread: partial.unread ?? true,
    href: partial.href ?? "/go",
    kind: partial.kind ?? "go_review",
  };
}

test("hides follows, likes, comments, DMs and old SOS alerts", () => {
  const hidden = [
    item({ kind: "follow", body: "started following you", href: "/profile/abc" }),
    item({ kind: "comment", body: "commented on your post", href: "/home?post=1" }),
    item({ kind: "like", body: "liked your post" }),
    item({ kind: "reaction", body: "reacted to your message", href: "/messages?c=1" }),
    item({ kind: "message", body: "sent you a message", href: "/messages?c=1" }),
    item({ kind: "emergency_alert", body: "URGENT HARASSMENT: Razia needs help.", href: "/rider-benefits?alert=1" }),
    item({ kind: "go_review", body: "URGENT HARASSMENT slipped into a ride notice" }),
  ];
  for (const row of hidden) assert.equal(isRideNotification(row), false, row.kind);
  assert.deepEqual(visibleInboxItems(hidden), []);
});

test("keeps ride, approval and birthday notices and points them at ride pages", () => {
  const kept = visibleInboxItems([
    item({ id: "ride", kind: "go_accepted", body: "Your SheRides rider is confirmed", href: "/go/ride/1" }),
    item({ id: "book", kind: "go_review", body: "approved your booking access. You can book rides now.", href: "/go" }),
    item({ id: "partner", kind: "partner_review", body: "approved your partner application.", href: "/partner" }),
    item({ id: "wish", kind: "birthday", body: "Happy birthday", href: "/home" }),
    item({ id: "captain", kind: "go_request", body: "New SheRides ride request near you", href: "/go?tab=rider" }),
  ]);
  assert.deepEqual(
    kept.map((row) => [row.id, row.href]),
    [
      ["ride", "/go/ride/1"],
      ["book", "/go"],
      ["partner", "/partner"],
      ["wish", "/profile"],
      ["captain", "/go?tab=rider"],
    ]
  );
});

test("retired social links fall back to booking", () => {
  assert.equal(rideNotificationHref("go_message", "/messages?c=1"), "/go");
  assert.equal(rideNotificationHref("birthday", "/home"), "/profile");
  assert.equal(rideNotificationHref("go_review", "/go"), "/go");
});
