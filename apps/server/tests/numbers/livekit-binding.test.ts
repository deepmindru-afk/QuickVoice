import assert from "node:assert/strict";
import { test } from "node:test";

import type { PhoneNumber } from "../../prisma/generated/prisma/client.js";
import { createLiveKitBindingSetter } from "../../src/common/utils/setLiveKitBinding.js";

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

test("LiveKit binding adds a real phone number to the inbound trunk", async () => {
  const calls: unknown[] = [];
  const setLiveKitBinding = createLiveKitBindingSetter({
    inboundTrunkId: "livekit-inbound-trunk",
    listUpdateFactory: (input) => input,
    sipClient: {
      updateSipInboundTrunkFields: async (...args) => {
        calls.push(args);
      },
    },
  });

  await setLiveKitBinding(true, phone({ number: "+14155550102" }));

  assert.deepEqual(calls, [
    ["livekit-inbound-trunk", { numbers: { add: ["+14155550102"] } }],
  ]);
});

test("LiveKit binding removes a real phone number from the inbound trunk", async () => {
  const calls: unknown[] = [];
  const setLiveKitBinding = createLiveKitBindingSetter({
    inboundTrunkId: "livekit-inbound-trunk",
    listUpdateFactory: (input) => input,
    sipClient: {
      updateSipInboundTrunkFields: async (...args) => {
        calls.push(args);
      },
    },
  });

  await setLiveKitBinding(false, phone({ number: "+14155550102" }));

  assert.deepEqual(calls, [
    ["livekit-inbound-trunk", { numbers: { remove: ["+14155550102"] } }],
  ]);
});

test("LiveKit binding skips seeded demo numbers", async () => {
  const setLiveKitBinding = createLiveKitBindingSetter({
    inboundTrunkId: "livekit-inbound-trunk",
    listUpdateFactory: (input) => input,
    sipClient: {
      updateSipInboundTrunkFields: async () => {
        throw new Error("should not call LiveKit for seed numbers");
      },
    },
  });

  await setLiveKitBinding(true, phone({ sid: "SEED1234567890" }));
});

test("LiveKit binding reports missing inbound trunk configuration", async () => {
  const setLiveKitBinding = createLiveKitBindingSetter({
    inboundTrunkId: "",
    listUpdateFactory: (input) => input,
    sipClient: {
      updateSipInboundTrunkFields: async () => {
        throw new Error("should not update without trunk id");
      },
    },
  });

  await assert.rejects(
    () => setLiveKitBinding(true, phone()),
    /LIVEKIT_SIP_INBOUND_TRUNK_ID is required/
  );
});
