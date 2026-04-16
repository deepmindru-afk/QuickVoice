// Attach or detach a phone number at its upstream provider — Twilio's
// IncomingPhoneNumber.trunkSid, or Telnyx's PhoneNumber.connection_id. Passing
// `attach: false` clears the binding (empty string).

import type { PhoneNumber } from "../../../prisma/generated/prisma/client.js";
import { TelephonyProvider } from "../../../prisma/generated/prisma/client.js";
import { TELNYX_CONNECTION_ID, telnyxClient } from "../../config/telnyx.js";
import { TWILIO_TRUNK_SID, twilioClient } from "../../config/twilio.js";

const setProviderBinding = async (attach: boolean, existing: PhoneNumber) => {
  if (existing.provider === TelephonyProvider.TWILIO) {
    await twilioClient.incomingPhoneNumbers(existing.sid).update({
      trunkSid: attach ? TWILIO_TRUNK_SID : "",
    });
  } else {
    await telnyxClient.phoneNumbers.update(existing.number, {
      connection_id: attach ? TELNYX_CONNECTION_ID : "",
    });
  }
};

export default setProviderBinding;
