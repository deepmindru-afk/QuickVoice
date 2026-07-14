import type { PhoneNumber } from "../../../prisma/generated/prisma/client.js";

export function isSeedPhoneNumber(existing: Pick<PhoneNumber, "sid">) {
  return existing.sid.startsWith("SEED");
}
