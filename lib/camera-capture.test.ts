import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FACE_TIMER_SECONDS,
  beginCapture,
  cancelCaptureSession,
  classifyCameraFailure,
  countdownFiresCapture,
  createCaptureSession,
  finishCapture,
  isCurrentCapture,
  isUsableVideoFrame,
  tickCountdown,
} from "./camera-capture";

test("a video frame is usable only after the element has real dimensions", () => {
  assert.equal(isUsableVideoFrame(null), false);
  assert.equal(isUsableVideoFrame({ readyState: 2, videoWidth: 0, videoHeight: 480 }), false);
  assert.equal(isUsableVideoFrame({ readyState: 1, videoWidth: 640, videoHeight: 480 }), false);
  assert.equal(isUsableVideoFrame({ readyState: 2, videoWidth: 640, videoHeight: 480 }), true);
});

test("permission denial stays a denial, and an instant refusal stays blocked", () => {
  assert.equal(classifyCameraFailure("NotAllowedError", 900, "prompt"), "denied");
  assert.equal(classifyCameraFailure("NotAllowedError", 20, "prompt"), "blocked");
  assert.equal(classifyCameraFailure("SecurityError", 900, "denied"), "blocked");
  assert.equal(classifyCameraFailure("NotFoundError", 10, "prompt"), "nocamera");
  assert.equal(classifyCameraFailure("NotReadableError", 10, "granted"), "busy");
  assert.equal(classifyCameraFailure("AbortError", 10, "prompt"), "other");
});

test("the face timer counts 3, 2, 1 and captures at 0", () => {
  let value: number = FACE_TIMER_SECONDS;
  assert.equal(value, 3);
  assert.equal(countdownFiresCapture(value), false);
  value = tickCountdown(value);
  assert.equal(value, 2);
  value = tickCountdown(value);
  assert.equal(value, 1);
  value = tickCountdown(value);
  assert.equal(value, 0);
  assert.equal(countdownFiresCapture(value), true);
});

test("a manual capture and the timer cannot both take a photo", () => {
  const session = createCaptureSession();
  const manual = beginCapture(session);
  const timer = beginCapture(session);
  assert.equal(typeof manual, "number");
  assert.equal(timer, null);
  assert.equal(isCurrentCapture(session, manual as number), true);
  finishCapture(session, manual as number);
  assert.equal(session.busy, false);
});

test("closing or retaking cancels the timer capture before its blob returns", () => {
  const session = createCaptureSession();
  const generation = beginCapture(session);
  assert.equal(generation, 1);
  cancelCaptureSession(session);
  assert.equal(isCurrentCapture(session, generation as number), false);
  assert.equal(session.busy, false);
  const next = beginCapture(session);
  assert.equal(next, 3);
});
