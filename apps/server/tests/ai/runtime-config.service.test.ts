import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveAgentRuntimeConfig } from "../../src/modules/ai/runtime-config.service.js";

const source = {
  agentId: "8d55565f-1111-4111-8111-f95fd03f0df2",
  organizationId: "org_123",
  userId: "user_123",
  number: "+15551230000",
  provider: "TWILIO",
  configuration: {
    firstMessage: "Hello from DB.",
    systemPrompt: "Prompt from DB.",
    llmModel: "gpt-4o-mini",
    voiceId: "aura-2-asteria-en",
    agent_language: "en",
    use_rag: false,
    data_needed: [],
    data_evaluation: [],
    post_call_webhook: null,
    initiation_webhook: null,
    variables: null,
    preemptive_generation: false,
    timezone: "UTC",
  },
};

test("resolveAgentRuntimeConfig resolves by agent id", async () => {
  const calls: string[] = [];

  const runtime = await resolveAgentRuntimeConfig(
    { agentId: source.agentId },
    {
      findByAgentId: async (agentId) => {
        calls.push(`agent:${agentId}`);
        return source;
      },
      findByPhoneNumber: async (phoneNumber) => {
        calls.push(`phone:${phoneNumber}`);
        return null;
      },
    }
  );

  assert.equal(runtime.agentId, source.agentId);
  assert.equal(runtime.firstMessage, "Hello from DB.");
  assert.deepEqual(calls, [`agent:${source.agentId}`]);
});

test("resolveAgentRuntimeConfig resolves inbound calls by assigned phone number", async () => {
  const calls: string[] = [];

  const runtime = await resolveAgentRuntimeConfig(
    { phoneNumber: source.number },
    {
      findByAgentId: async (agentId) => {
        calls.push(`agent:${agentId}`);
        return null;
      },
      findByPhoneNumber: async (phoneNumber) => {
        calls.push(`phone:${phoneNumber}`);
        return source;
      },
    }
  );

  assert.equal(runtime.agentNumber, source.number);
  assert.equal(runtime.provider, "TWILIO");
  assert.deepEqual(calls, [`phone:${source.number}`]);
});
