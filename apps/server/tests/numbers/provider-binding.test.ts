import assert from "node:assert/strict";
import { test } from "node:test";

import type { PhoneNumber } from "../../prisma/generated/prisma/client.js";
import { createProviderBindingSetter } from "../../src/common/utils/setProviderBinding.js";

function phone(overrides: Partial<PhoneNumber> = {}): PhoneNumber {
  const now = new Date("2026-01-01T00:00:00.000Z");
  return {
    phId: "phone-123",
    number: "+14155550102",
    organizationId: "org-123",
    userId: "user-123",
    agentId: null,
    sid: "provider-number-id",
    friendlyName: "Support line",
    provider: "TELNYX",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as PhoneNumber;
}

test("Telnyx provider binding uses the stored provider ID", async () => {
  const calls: unknown[] = [];
  const setProviderBinding = createProviderBindingSetter({
    telnyxConnectionId: "telnyx-connection-123",
    telnyxPhoneNumbers: {
      update: async (...args) => {
        calls.push(args);
      },
    },
  });

  await setProviderBinding(
    true,
    phone({ sid: "telnyx-phone-number-id", number: "+14155550102" })
  );

  assert.deepEqual(calls, [
    ["telnyx-phone-number-id", { connection_id: "telnyx-connection-123" }],
  ]);
});

test("Telnyx provider binding clears the stored provider ID on detach", async () => {
  const calls: unknown[] = [];
  const setProviderBinding = createProviderBindingSetter({
    telnyxPhoneNumbers: {
      update: async (...args) => {
        calls.push(args);
      },
    },
  });

  await setProviderBinding(false, phone({ sid: "telnyx-phone-number-id" }));

  assert.deepEqual(calls, [["telnyx-phone-number-id", { connection_id: "" }]]);
});

test("Twilio provider binding uses the stored provider SID", async () => {
  const calls: unknown[] = [];
  const setProviderBinding = createProviderBindingSetter({
    twilioTrunkSid: "twilio-trunk-123",
    twilioIncomingPhoneNumbers: (sid) => ({
      update: async (input) => {
        calls.push([sid, input]);
      },
    }),
  });

  await setProviderBinding(
    true,
    phone({ provider: "TWILIO", sid: "twilio-incoming-number-sid" })
  );

  assert.deepEqual(calls, [
    ["twilio-incoming-number-sid", { trunkSid: "twilio-trunk-123" }],
  ]);
});

test("provider binding skips seeded demo numbers", async () => {
  const setProviderBinding = createProviderBindingSetter({
    telnyxConnectionId: "telnyx-connection-123",
    telnyxPhoneNumbers: {
      update: async () => {
        throw new Error("should not call Telnyx for seed numbers");
      },
    },
  });

  await setProviderBinding(true, phone({ sid: "SEED1234567890" }));
});

test("provider binding reports missing Telnyx connection configuration", async () => {
  const setProviderBinding = createProviderBindingSetter({
    telnyxConnectionId: "",
    telnyxPhoneNumbers: {
      update: async () => {
        throw new Error("should not update without connection id");
      },
    },
  });

  await assert.rejects(
    () => setProviderBinding(true, phone()),
    /TELNYX_CONNECTION_ID is required/
  );
});
