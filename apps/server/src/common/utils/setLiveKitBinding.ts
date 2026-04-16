// Add or remove a phone number from the shared LiveKit inbound SIP trunk.
// Passing `attach: false` removes the number from the trunk.

import { ListUpdate } from "@livekit/protocol";
import type { PhoneNumber } from "../../../prisma/generated/prisma/client.js";
import {
  LIVEKIT_SIP_INBOUND_TRUNK_ID,
  livekitSipClient,
} from "../../config/livekit.js";

const setLiveKitBinding = async (attach: boolean, existing: PhoneNumber) => {
  await livekitSipClient.updateSipInboundTrunkFields(
    LIVEKIT_SIP_INBOUND_TRUNK_ID,
    {
      numbers: attach
        ? new ListUpdate({ add: [existing.number] })
        : new ListUpdate({ remove: [existing.number] }),
    }
  );
};

export default setLiveKitBinding;
