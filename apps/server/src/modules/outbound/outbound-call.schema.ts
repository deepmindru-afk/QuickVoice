import { z } from "zod";
import {
  CallStatus,
  OutboundCallMode,
  TelephonyProvider,
} from "../../../prisma/generated/prisma/client.js";

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
  provider: providerSchema.optional(),
  sid: z.string().min(1, "Provider SID is required").optional(),
});

export type QuickOutboundCallInput = z.infer<typeof quickOutboundCallSchema>;
export type QuickOutboundCallArgs = QuickOutboundCallInput & {
  organizationId: string;
  userId: string;
};

const statusSchema = z.preprocess((value) => {
  if (typeof value === "string") return value.toUpperCase();
  return value;
}, z.nativeEnum(CallStatus));

export const listOutboundCallsQuerySchema = z
  .object({
    agentId: z.string().uuid().optional(),
    status: statusSchema.optional(),
    mode: z.nativeEnum(OutboundCallMode).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().min(1).optional(),
  })
  .strip();

export const cancelOutboundCallSchema = z
  .object({
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strip();

export type ListOutboundCallsQuery = z.infer<typeof listOutboundCallsQuerySchema>;
export type ListOutboundCallsArgs = ListOutboundCallsQuery & {
  organizationId: string;
};

export type CancelOutboundCallInput = z.infer<typeof cancelOutboundCallSchema>;
