import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import type { Server } from "node:http";

import { createRuntimeConfigRouter } from "../../src/modules/ai/runtime-config.route.js";

let server: Server;
let baseUrl: string;

before(async () => {
  process.env.INTERNAL_API_KEY = "test-internal-key";
  const app = express();
  app.use(
    "/api/v1/ai",
    createRuntimeConfigRouter({
      resolveAgentRuntimeConfig: async (input) => ({
        agentId: input.agentId ?? "resolved-agent",
        organizationId: "org_123",
        userId: "user_123",
        agentNumber: input.phoneNumber ?? "+15551230000",
        provider: "TWILIO",
        firstMessage: "Hello from route.",
        systemPrompt: "Route prompt.",
        llmModel: "openai/gpt-4o-mini",
        llmProvider: "openai",
        ttsModel: "deepgram/aura-2",
        voiceId: "aura-2-asteria-en",
        agent_language: "en-US",
        use_rag: false,
        data_needed: [],
        data_evaluation: [],
        post_call_webhook: null,
        initiation_webhook: null,
        variables: null,
        preemptive_generation: false,
        timezone: "UTC",
      }),
    })
  );

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /runtime-config requires the internal bearer token", async () => {
  const response = await fetch(`${baseUrl}/api/v1/ai/runtime-config?agentId=agent_123`);
  assert.equal(response.status, 401);
});

test("GET /runtime-config resolves config with agent id and phone number", async () => {
  const response = await fetch(
    `${baseUrl}/api/v1/ai/runtime-config?agentId=agent_123&phoneNumber=%2B15551230000`,
    { headers: { Authorization: "Bearer test-internal-key" } }
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.agentId, "agent_123");
  assert.equal(body.data.agentNumber, "+15551230000");
  assert.equal(body.data.firstMessage, "Hello from route.");
});
