import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseLiveTranscriptEvent,
  parseWatchCallRequest,
} from "../../src/realtime/live-transcript.contract.js";

const started = {
  version: 1,
  type: "call.started",
  organizationId: "org_123",
  callId: "call_123",
  roomName: "room_123",
  eventId: "1720000000000-0",
  occurredAt: "2026-07-16T12:00:00.000Z",
  agentId: "agent_123",
  direction: "inbound",
  fromNumber: "+15550001111",
  toNumber: "+15550002222",
  startedAt: "2026-07-16T12:00:00.000Z",
  status: "active",
};

test("parses a valid versioned lifecycle event", () => {
  assert.deepEqual(parseLiveTranscriptEvent(JSON.stringify(started)), started);
});

test("rejects unknown event fields and malformed watch payloads", () => {
  assert.equal(
    parseLiveTranscriptEvent({ ...started, unexpected: "not-reviewed" }),
    null
  );
  assert.equal(parseWatchCallRequest({ callId: "call_123", organizationId: "org_other" }), null);
  assert.deepEqual(parseWatchCallRequest({ callId: "call_123" }), {
    callId: "call_123",
  });
});

test("uses the Redis Stream id as the authoritative replay event id", () => {
  const transcript = {
    version: 1,
    type: "transcript.final",
    organizationId: "org_123",
    callId: "call_123",
    roomName: "room_123",
    occurredAt: "2026-07-16T12:00:01.000Z",
    messageId: "message_123",
    speaker: "user",
    text: "Hello",
    timestamp: "2026-07-16T12:00:01.000Z",
  };
  const parsed = parseLiveTranscriptEvent(JSON.stringify(transcript), {
    eventId: "1720000001000-3",
  });
  assert.equal(parsed?.eventId, "1720000001000-3");
  assert.equal(parsed?.type, "transcript.final");
});
