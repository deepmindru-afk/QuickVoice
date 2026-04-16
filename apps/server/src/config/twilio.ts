import twilio from "twilio";

// Singleton Twilio client. Credentials come from TWILIO_ACCOUNT_SID /
// TWILIO_AUTH_TOKEN. Consumers should validate that TWILIO_TRUNK_SID is set
// before calling any flow that attaches numbers to the Elastic SIP Trunk.
export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export const TWILIO_TRUNK_SID = process.env.TWILIO_TRUNK_SID ?? "";
