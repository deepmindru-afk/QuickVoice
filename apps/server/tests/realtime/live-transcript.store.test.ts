import assert from "node:assert/strict";
import { test } from "node:test";

import { LiveTranscriptStore } from "../../src/realtime/live-transcript.store.js";

function transcript(callId: string, text: string) {
  return JSON.stringify({
    version: 1,
    type: "transcript.final",
    organizationId: "org_123",
    callId,
    roomName: "room_123",
    occurredAt: "2026-07-16T12:00:01.000Z",
    messageId: `message_${text}`,
    speaker: "agent",
    text,
    timestamp: "2026-07-16T12:00:01.000Z",
  });
}

test("replay returns only tenant/call-matching transcript entries with stream ids", async () => {
  const redis = {
    xrange: async () => [
      ["1720000001000-0", ["event", transcript("call_123", "first")]],
      ["1720000002000-0", ["event", transcript("call_other", "hidden")]],
      ["1720000003000-0", ["event", "{not json"]],
    ],
  };
  const store = new LiveTranscriptStore(redis as any);
  const messages = await store.readTranscriptHistory("org_123", "call_123");

  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.text, "first");
  assert.equal(messages[0]?.eventId, "1720000001000-0");
});

test("call access is derived only from the authenticated organization's keys", async () => {
  const keys: string[] = [];
  const redis = {
    hget: async (key: string) => {
      keys.push(key);
      return null;
    },
    get: async (key: string) => {
      keys.push(key);
      return null;
    },
    exists: async (key: string) => {
      keys.push(key);
      return 1;
    },
  };
  const store = new LiveTranscriptStore(redis as any);
  const access = await store.getCallAccess("org_safe", "call_123");

  assert.equal(access?.status, "ended");
  assert.ok(keys.every((key) => key.includes("org_safe")));
});
