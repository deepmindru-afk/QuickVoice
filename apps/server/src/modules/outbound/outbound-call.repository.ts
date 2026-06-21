import { CallStatus, OutboundCallMode, Prisma } from "../../../prisma/generated/prisma/client.js";
import { plans } from "../../../data/plans.js";
import prisma from "../../config/prisma.js";
import type { ListOutboundCallsArgs, QuickOutboundCallArgs } from "./outbound-call.schema.js";

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

export async function listForOrg(args: ListOutboundCallsArgs) {
  const where = outboundWhere(args);
  const [items, count] = await prisma.$transaction([
    prisma.outboundCall.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: args.limit,
      ...(args.cursor ? { cursor: { outboundId: args.cursor }, skip: 1 } : {}),
      include: {
        callLog: {
          select: {
            callId: true,
            status: true,
            startTime: true,
            endTime: true,
            durationSeconds: true,
          },
        },
      },
    }),
    prisma.outboundCall.count({ where }),
  ]);

  return { items, count };
}

export async function getForOrg(outboundId: string, organizationId: string) {
  return prisma.outboundCall.findFirst({
    where: { outboundId, organizationId },
    include: {
      callLog: {
        select: {
          callId: true,
          status: true,
          startTime: true,
          endTime: true,
          durationSeconds: true,
        },
      },
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

export async function markCancelled(args: {
  outboundId: string;
  organizationId: string;
  userId: string;
  reason: string;
}) {
  const existing = await getForOrg(args.outboundId, args.organizationId);
  const optionalData = {
    ...jsonObject(existing?.optionalData),
    cancelledAt: new Date().toISOString(),
    cancelledBy: args.userId,
    cancellationReason: args.reason,
    failureReason: args.reason,
  } satisfies Prisma.InputJsonObject;

  return prisma.outboundCall.update({
    where: { outboundId: args.outboundId },
    data: {
      status: CallStatus.FAILED,
      optionalData,
    },
    include: {
      callLog: {
        select: {
          callId: true,
          status: true,
          startTime: true,
          endTime: true,
          durationSeconds: true,
        },
      },
    },
  });
}

export async function getMonthlyUsage(organizationId: string, now = new Date()) {
  const [organization, usage] = await prisma.$transaction([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    }),
    prisma.callLog.aggregate({
      where: {
        organizationId,
        deleted: false,
        startTime: { gte: startOfUtcMonth(now) },
      },
      _sum: { durationSeconds: true },
    }),
  ]);

  const plan = organization?.plan ?? "free";
  const includedMinutes =
    plans.find((item) => item.id === plan)?.minutes ?? null;

  return {
    plan,
    includedMinutes,
    usedSeconds: usage._sum.durationSeconds ?? 0,
  };
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function outboundWhere(args: ListOutboundCallsArgs): Prisma.OutboundCallWhereInput {
  return {
    organizationId: args.organizationId,
    ...(args.agentId ? { agentId: args.agentId } : {}),
    ...(args.status ? { status: args.status } : {}),
    ...(args.mode ? { mode: args.mode } : {}),
  };
}

function jsonObject(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Prisma.InputJsonObject;
}
