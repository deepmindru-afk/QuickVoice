import assert from "node:assert/strict";
import { test } from "node:test";

import { quickOutboundCallSchema } from "../../src/modules/outbound/outbound-call.schema.js";

test("quickOutboundCallSchema accepts console lowercase provider and normalizes it", () => {
  const parsed = quickOutboundCallSchema.parse({
    agentId: "8d55565f-1111-4111-8111-f95fd03f0df2",
    phoneNumber: "+15550001111",
    fromNumber: "+15551230000",
    provider: "twilio",
    sid: "carrier-sid-123",
  });

  assert.equal(parsed.provider, "TWILIO");
});

test("quickOutboundCallSchema accepts quick-call payload without provider internals", () => {
  const parsed = quickOutboundCallSchema.parse({
    agentId: "8d55565f-1111-4111-8111-f95fd03f0df2",
    phoneNumber: "+15550001111",
    fromNumber: "+15551230000",
    firstMessage: "This is a short test call.",
  });

  assert.equal(parsed.agentId, "8d55565f-1111-4111-8111-f95fd03f0df2");
  assert.equal(parsed.phoneNumber, "+15550001111");
  assert.equal(parsed.fromNumber, "+15551230000");
  assert.equal(parsed.provider, undefined);
  assert.equal(parsed.sid, undefined);
});
