import { z } from "zod";
import { TelephonyProvider } from "../../../prisma/generated/prisma/client.js";

const providerSchema = z.preprocess((value) => {
  if (typeof value === "string") return value.toUpperCase();
  return value;
}, z.nativeEnum(TelephonyProvider));

export const quickOutboundCallSchema = z.object({
  agentId: z.string().uuid(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  fromNumber: z.string().min(10, "From number must be at least 10 digits"),
  firstMessage: z.string().optional(),
  systemPrompt: z.string().optional(),
  username: z.string().optional(),
  provider: providerSchema,
  sid: z.string().min(1, "Provider SID is required"),
});

export type QuickOutboundCallInput = z.infer<typeof quickOutboundCallSchema>;
export type QuickOutboundCallArgs = QuickOutboundCallInput & {
  organizationId: string;
  userId: string;
};
