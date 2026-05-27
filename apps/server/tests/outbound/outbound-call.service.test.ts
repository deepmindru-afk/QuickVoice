import assert from "node:assert/strict";
import { test } from "node:test";

import { createQuickOutboundCall } from "../../src/modules/outbound/outbound-call.service.js";

test("createQuickOutboundCall persists the quick call and dispatches a LiveKit SIP participant", async () => {
  const calls: unknown[] = [];
  const repo = {
    createQuickCall: async (input: any) => {
      calls.push(["create", input]);
      return { outboundId: "2b1f6d53-42f5-4cc7-9689-7b6f51a0c113", ...input };
    },
    markInProgress: async (outboundId: string, livekitParticipant: unknown) => {
      calls.push(["progress", outboundId, livekitParticipant]);
      return { outboundId, status: "IN_PROGRESS", livekitParticipant };
    },
    markFailed: async (outboundId: string, reason: string) => {
      calls.push(["failed", outboundId, reason]);
      return { outboundId, status: "FAILED" };
    },
  };
  const sipClient = {
    createSipParticipant: async (...args: unknown[]) => {
      calls.push(["sip", ...args]);
      return { participantId: "sip-participant-123" };
    },
  };
  const dispatchClient = {
    createDispatch: async (...args: unknown[]) => {
      calls.push(["dispatch", ...args]);
      return { dispatchId: "agent-dispatch-123" };
    },
  };

  const result = await createQuickOutboundCall(
    {
      organizationId: "org_123",
      userId: "user_123",
      agentId: "8d55565f-1111-4111-8111-f95fd03f0df2",
      phoneNumber: "+15550001111",
      fromNumber: "+15551230000",
      firstMessage: "Hello from outbound.",
      systemPrompt: "Outbound prompt.",
      username: "Ada",
      provider: "TWILIO",
      sid: "carrier-sid-123",
    },
    {
      repository: repo,
      sipClient,
      dispatchClient,
      outboundTrunks: { TWILIO: "twilio-trunk", TELNYX: "telnyx-trunk" },
      agentName: "QuickVoice",
    }
  );

  assert.equal(result.outbound.outboundId, "2b1f6d53-42f5-4cc7-9689-7b6f51a0c113");
  assert.equal(result.livekitParticipant.participantId, "sip-participant-123");
  assert.equal(result.agentDispatch.dispatchId, "agent-dispatch-123");

  const create = calls[0] as any[];
  assert.equal(create[0], "create");
  assert.equal(create[1].status, "SCHEDULED");
  assert.equal(create[1].mode, "quick");
  assert.deepEqual(create[1].optionalData, { username: "Ada", sid: "carrier-sid-123" });

  const dispatch = calls[1] as any[];
  assert.equal(dispatch[0], "dispatch");
  assert.equal(dispatch[1], "outbound_2b1f6d53-42f5-4cc7-9689-7b6f51a0c113");
  assert.equal(dispatch[2], "QuickVoice");

  const dispatchMetadata = JSON.parse(dispatch[3].metadata);
  assert.equal(dispatchMetadata.outbound_id, "2b1f6d53-42f5-4cc7-9689-7b6f51a0c113");
  assert.equal(dispatchMetadata.direction, "outbound");

  const sip = calls[2] as any[];
  assert.equal(sip[0], "sip");
  assert.equal(sip[1], "twilio-trunk");
  assert.equal(sip[2], "+15550001111");
  assert.equal(sip[3], "outbound_2b1f6d53-42f5-4cc7-9689-7b6f51a0c113");
  assert.equal(sip[4].fromNumber, "+15551230000");
  assert.equal(sip[4].participantIdentity, "outbound-2b1f6d53-42f5-4cc7-9689-7b6f51a0c113");
  assert.equal(sip[4].waitUntilAnswered, false);

  const metadata = JSON.parse(sip[4].participantMetadata);
  assert.deepEqual(metadata, {
    agent_id: "8d55565f-1111-4111-8111-f95fd03f0df2",
    outbound_id: "2b1f6d53-42f5-4cc7-9689-7b6f51a0c113",
    direction: "outbound",
    from_number: "+15551230000",
    to_number: "+15550001111",
    provider: "TWILIO",
    first_message: "Hello from outbound.",
    system_prompt: "Outbound prompt.",
    username: "Ada",
  });

  assert.deepEqual(calls[3], ["progress", "2b1f6d53-42f5-4cc7-9689-7b6f51a0c113", { username: "Ada", sid: "carrier-sid-123", livekitParticipant: { participantId: "sip-participant-123" }, agentDispatch: { dispatchId: "agent-dispatch-123" } }]);
});

test("createQuickOutboundCall marks the outbound row failed when LiveKit dispatch fails", async () => {
  const calls: unknown[] = [];
  const repo = {
    createQuickCall: async (input: any) => ({ outboundId: "2b1f6d53-42f5-4cc7-9689-7b6f51a0c113", ...input }),
    markInProgress: async () => { throw new Error("should not mark progress"); },
    markFailed: async (outboundId: string, reason: string) => {
      calls.push([outboundId, reason]);
      return { outboundId, status: "FAILED" };
    },
  };
  const sipClient = {
    createSipParticipant: async () => {
      throw new Error("LiveKit unavailable");
    },
  };
  const dispatchClient = {
    createDispatch: async () => ({ dispatchId: "agent-dispatch-123" }),
  };

  await assert.rejects(
    createQuickOutboundCall(
      {
        organizationId: "org_123",
        userId: "user_123",
        agentId: "8d55565f-1111-4111-8111-f95fd03f0df2",
        phoneNumber: "+15550001111",
        fromNumber: "+15551230000",
        provider: "TELNYX",
        sid: "carrier-sid-123",
      },
      {
        repository: repo,
        sipClient,
        dispatchClient,
        outboundTrunks: { TWILIO: "twilio-trunk", TELNYX: "telnyx-trunk" },
        agentName: "QuickVoice",
      }
    ),
    /LiveKit unavailable/
  );

  assert.equal(calls.length, 1);
  assert.equal((calls[0] as any[])[0], "2b1f6d53-42f5-4cc7-9689-7b6f51a0c113");
  assert.match((calls[0] as any[])[1], /LiveKit unavailable/);
});
