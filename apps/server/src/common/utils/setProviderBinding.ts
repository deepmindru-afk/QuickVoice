// Attach or detach a phone number at its upstream provider — Twilio's
// IncomingPhoneNumber.trunkSid, or Telnyx's PhoneNumber.connection_id. Passing
// `attach: false` clears the binding (empty string).

import type { PhoneNumber } from "../../../prisma/generated/prisma/client.js";
import { TelephonyProvider } from "../../../prisma/generated/prisma/client.js";
import { BadRequestError } from "../errors/badRequest.js";
import { TELNYX_CONNECTION_ID, telnyxClient } from "../../config/telnyx.js";
import { TWILIO_TRUNK_SID, twilioClient } from "../../config/twilio.js";
import { isSeedPhoneNumber } from "./phoneNumberGuards.js";

type TwilioIncomingPhoneNumbers = (sid: string) => {
  update: (input: { trunkSid: string }) => Promise<unknown>;
};

type TelnyxPhoneNumbers = {
  update: (id: string, input: { connection_id: string }) => Promise<unknown>;
};

export type ProviderBindingDeps = {
  twilioIncomingPhoneNumbers?: TwilioIncomingPhoneNumbers;
  twilioTrunkSid?: string;
  telnyxPhoneNumbers?: TelnyxPhoneNumbers;
  telnyxConnectionId?: string;
};

export function createProviderBindingSetter(deps: ProviderBindingDeps = {}) {
  return async (attach: boolean, existing: PhoneNumber) => {
    if (isSeedPhoneNumber(existing)) {
      return;
    }

    if (!existing.sid) {
      throw new BadRequestError(
        "Phone number is missing its provider ID. Buy or import a real provider number before routing calls."
      );
    }

    if (existing.provider === TelephonyProvider.TWILIO) {
      const trunkSid = deps.twilioTrunkSid ?? TWILIO_TRUNK_SID;
      if (attach && !trunkSid) {
        throw new BadRequestError(
          "TWILIO_TRUNK_SID is required before assigning a Twilio number to an agent"
        );
      }

      const incomingPhoneNumbers =
        deps.twilioIncomingPhoneNumbers ??
        ((sid: string) => twilioClient.incomingPhoneNumbers(sid));
      await incomingPhoneNumbers(existing.sid).update({
        trunkSid: attach ? trunkSid : "",
      });
      return;
    }

    const connectionId = deps.telnyxConnectionId ?? TELNYX_CONNECTION_ID;
    if (attach && !connectionId) {
      throw new BadRequestError(
        "TELNYX_CONNECTION_ID is required before assigning a Telnyx number to an agent"
      );
    }

    await (deps.telnyxPhoneNumbers ?? telnyxClient.phoneNumbers).update(
      existing.sid,
      {
        connection_id: attach ? connectionId : "",
      }
    );
  };
}

const setProviderBinding = createProviderBindingSetter();

export default setProviderBinding;
