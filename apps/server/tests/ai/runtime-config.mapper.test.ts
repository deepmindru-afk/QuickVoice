import assert from "node:assert/strict";
import { test } from "node:test";

import { buildAgentRuntimeConfig } from "../../src/modules/ai/runtime-config.mapper.js";

test("buildAgentRuntimeConfig maps console agent config to AI runtime config", () => {
  const runtime = buildAgentRuntimeConfig({
    agentId: "8d55565f-1111-4111-8111-f95fd03f0df2",
    organizationId: "org_123",
    userId: "user_123",
    number: "+15551230000",
    provider: "TWILIO",
    configuration: {
      firstMessage: "Hello, thanks for calling QuickVoice.",
      systemPrompt: "You are a concise support agent.",
      llmModel: "gpt-4o-mini",
      voiceId: "aura-2-asteria-en",
      agent_language: "en",
      use_rag: true,
      data_needed: [{ id: "name", name: "Name" }],
      data_evaluation: [{ id: "tone", name: "Tone" }],
      post_call_webhook: { webhook_url: "https://example.com/hook", method: "POST" },
      initiation_webhook: null,
      variables: { firstMessage: [], systemPrompt: [], placeholders: { company: "QuickVoice" } },
      preemptive_generation: true,
      timezone: "America/New_York",
    },
  });

  assert.deepEqual(runtime, {
    agentId: "8d55565f-1111-4111-8111-f95fd03f0df2",
    organizationId: "org_123",
    userId: "user_123",
    agentNumber: "+15551230000",
    provider: "TWILIO",
    firstMessage: "Hello, thanks for calling QuickVoice.",
    systemPrompt: "You are a concise support agent.",
    llmModel: "openai/gpt-4o-mini",
    llmProvider: "openai",
    ttsModel: "deepgram/aura-2",
    voiceId: "aura-2-asteria-en",
    agent_language: "en-US",
    use_rag: true,
    data_needed: [{ id: "name", name: "Name" }],
    data_evaluation: [{ id: "tone", name: "Tone" }],
    post_call_webhook: { webhook_url: "https://example.com/hook", method: "POST" },
    initiation_webhook: null,
    variables: { firstMessage: [], systemPrompt: [], placeholders: { company: "QuickVoice" } },
    preemptive_generation: true,
    timezone: "America/New_York",
  });
});
