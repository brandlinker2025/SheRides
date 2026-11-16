import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { approvalNoticeBody, reviewInputError } from "./approval";

test("reject and suspend require a reason; approve does not", () => {
  assert.equal(reviewInputError("approved", ""), null);
  assert.equal(reviewInputError("pending", ""), null);
  assert.match(reviewInputError("rejected", " ") ?? "", /reason/);
  assert.match(reviewInputError("suspended", "n") ?? "", /reason/);
  assert.equal(reviewInputError("rejected", "NID photo is blurry"), null);
  assert.match(reviewInputError("nope", "") ?? "", /Invalid/);
});

test("approval notices tell the member what changed", () => {
  assert.match(approvalNoticeBody("passenger", "approved", ""), /book rides now/);
  assert.match(approvalNoticeBody("passenger", "rejected", "Photo is unclear"), /Photo is unclear/);
  assert.match(approvalNoticeBody("rider", "approved", ""), /go online/);
  assert.match(approvalNoticeBody("rider", "rejected", "Licence expired"), /Licence expired/);
  assert.match(approvalNoticeBody("partner", "approved", ""), /partner application/);
  assert.match(approvalNoticeBody("partner", "rejected", "Outside our cities"), /Outside our cities/);
});

test("the approval migration enforces is_admin and the same notice copy", () => {
  const sql = readFileSync("supabase/migrations/20261116140000_ride_inbox_and_approval_queue.sql", "utf8");
  assert.match(sql, /not public\.is_admin\(\)/);
  assert.match(sql, /Write a short reason before rejecting/);
  assert.match(sql, /approved your booking access\. You can book rides now\./);
  assert.match(sql, /approved your captain application\. You can go online\./);
  assert.match(sql, /approved your partner application\. SheRides will contact you about next steps\./);
  assert.match(sql, /partner_review/);
  assert.match(sql, /member_phones/);
  assert.match(sql, /notify_on_follow/);
  assert.match(sql, /emergency_alert/);
  assert.doesNotMatch(sql, /drop table/i);
});
