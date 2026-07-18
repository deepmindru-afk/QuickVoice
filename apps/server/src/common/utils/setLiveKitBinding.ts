// Add or remove a phone number from the shared LiveKit inbound SIP trunk.
// Passing `attach: false` removes the number from the trunk.

import { ListUpdate } from "@livekit/protocol";
import type { PhoneNumber } from "../../../prisma/generated/prisma/client.js";
import { BadRequestError } from "../errors/badRequest.js";
import {
  LIVEKIT_SIP_INBOUND_TRUNK_ID,
  livekitSipClient,
} from "../../config/livekit.js";
import { isSeedPhoneNumber } from "./phoneNumberGuards.js";

type LiveKitSipClient = {
  updateSipInboundTrunkFields: (
    trunkId: string,
    fields: { numbers: ListUpdate }
  ) => Promise<unknown>;
};

type ListUpdateFactory = (input: { add?: string[]; remove?: string[] }) => ListUpdate;

export type LiveKitBindingDeps = {
  inboundTrunkId?: string;
  sipClient?: LiveKitSipClient;
  listUpdateFactory?: ListUpdateFactory;
};

export function createLiveKitBindingSetter(deps: LiveKitBindingDeps = {}) {
  return async (attach: boolean, existing: PhoneNumber) => {
    if (isSeedPhoneNumber(existing)) {
      return;
    }

    const inboundTrunkId = deps.inboundTrunkId ?? LIVEKIT_SIP_INBOUND_TRUNK_ID;
    if (!inboundTrunkId) {
      throw new BadRequestError(
        "LIVEKIT_SIP_INBOUND_TRUNK_ID is required before assigning a number to an agent"
      );
    }

    const listUpdate = deps.listUpdateFactory ?? ((input) => new ListUpdate(input));
    await (deps.sipClient ?? livekitSipClient).updateSipInboundTrunkFields(
      inboundTrunkId,
      {
        numbers: attach
          ? listUpdate({ add: [existing.number] })
          : listUpdate({ remove: [existing.number] }),
      }
    );
  };
}

const setLiveKitBinding = createLiveKitBindingSetter();

export default setLiveKitBinding;
