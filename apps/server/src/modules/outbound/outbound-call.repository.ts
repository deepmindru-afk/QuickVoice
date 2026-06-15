import { CallStatus, OutboundCallMode, Prisma } from "../../../prisma/generated/prisma/client.js";
import prisma from "../../config/prisma.js";
import type { QuickOutboundCallArgs } from "./outbound-call.schema.js";

type CreateQuickCallInput = QuickOutboundCallArgs & {
  status: typeof CallStatus.SCHEDULED;
  mode: typeof OutboundCallMode.quick;
  optionalData: Prisma.InputJsonObject;
};

export async function createQuickCall(input: CreateQuickCallInput) {
  return prisma.outboundCall.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      agentId: input.agentId,
      phoneNumber: input.phoneNumber,
      fromNumber: input.fromNumber,
      firstMessage: input.firstMessage,
      systemPrompt: input.systemPrompt,
      optionalData: input.optionalData,
      mode: input.mode,
      status: input.status,
    },
  });
}

export async function getDialableNumber(args: {
  organizationId: string;
  agentId: string;
  fromNumber: string;
}) {
  return prisma.phoneNumber.findFirst({
    where: {
      organizationId: args.organizationId,
      agentId: args.agentId,
      number: args.fromNumber,
      agent: {
        isActive: true,
        isConfigured: true,
      },
    },
    select: {
      number: true,
      sid: true,
      provider: true,
    },
  });
}

export async function markInProgress(
  outboundId: string,
  optionalData: Prisma.InputJsonObject
) {
  return prisma.outboundCall.update({
    where: { outboundId },
    data: {
      status: CallStatus.IN_PROGRESS,
      optionalData,
    },
  });
}

export async function markFailed(outboundId: string, reason: string) {
  return prisma.outboundCall.update({
    where: { outboundId },
    data: {
      status: CallStatus.FAILED,
      optionalData: {
        failureReason: reason,
      } as Prisma.InputJsonObject,
    },
  });
}
