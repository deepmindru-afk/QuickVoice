import {
  CallStatus,
  OutboundCallMode,
  Prisma,
  TelephonyProvider,
} from "../../../prisma/generated/prisma/client.js";
import {
  LIVEKIT_AGENT_NAME,
  LIVEKIT_SIP_OUTBOUND_TRUNK_TELNYX_ID,
  LIVEKIT_SIP_OUTBOUND_TRUNK_TWILIO_ID,
  livekitAgentDispatchClient,
  livekitSipClient,
} from "../../config/livekit.js";
import { BadRequestError } from "../../common/errors/badRequest.js";
import { NotFoundError } from "../../common/errors/notFound.js";
import type { ListOutboundCallsArgs, QuickOutboundCallArgs } from "./outbound-call.schema.js";
import * as outboundCallRepository from "./outbound-call.repository.js";

type QuickOutboundCallRepository = {
  getDialableNumber: typeof outboundCallRepository.getDialableNumber;
  createQuickCall: typeof outboundCallRepository.createQuickCall;
  markInProgress: typeof outboundCallRepository.markInProgress;
  markFailed: typeof outboundCallRepository.markFailed;
  getMonthlyUsage?: typeof outboundCallRepository.getMonthlyUsage;
};

type OutboundCallWorkflowRepository = {
  listForOrg: typeof outboundCallRepository.listForOrg;
  getForOrg: typeof outboundCallRepository.getForOrg;
  markCancelled: typeof outboundCallRepository.markCancelled;
};

type SipClientLike = {
  createSipParticipant: (
    sipTrunkId: string,
    number: string,
    roomName: string,
    opts?: Record<string, unknown>
  ) => Promise<unknown>;
};

type AgentDispatchClientLike = {
  createDispatch: (
    roomName: string,
    agentName: string,
    options?: { metadata?: string }
  ) => Promise<unknown>;
  deleteDispatch?: (dispatchId: string, roomName: string) => Promise<void>;
};

type OutboundTrunks = Record<TelephonyProvider, string>;

type CreateQuickOutboundCallDeps = {
  repository?: QuickOutboundCallRepository;
  sipClient?: SipClientLike;
  dispatchClient?: AgentDispatchClientLike;
  outboundTrunks?: OutboundTrunks;
  agentName?: string;
};

type OutboundCallRecord = NonNullable<
  Awaited<ReturnType<typeof outboundCallRepository.getForOrg>>
>;

type OutboundWorkflowDeps = {
  repository?: OutboundCallWorkflowRepository;
};

type RetryOutboundWorkflowDeps = OutboundWorkflowDeps & {
  dispatchQuickCall?: typeof createQuickOutboundCall;
};

const defaultOutboundTrunks: OutboundTrunks = {
  [TelephonyProvider.TWILIO]: LIVEKIT_SIP_OUTBOUND_TRUNK_TWILIO_ID,
  [TelephonyProvider.TELNYX]: LIVEKIT_SIP_OUTBOUND_TRUNK_TELNYX_ID,
};

export async function createQuickOutboundCall(
  args: QuickOutboundCallArgs,
  deps: CreateQuickOutboundCallDeps = {}
) {
  const repository = deps.repository ?? outboundCallRepository;
  const sipClient = deps.sipClient ?? livekitSipClient;
  const dispatchClient = deps.dispatchClient ?? livekitAgentDispatchClient;
  const outboundTrunks = deps.outboundTrunks ?? defaultOutboundTrunks;
  const agentName = deps.agentName ?? LIVEKIT_AGENT_NAME;

  await enforcePlanQuota(repository, args.organizationId);

  const dialableNumber = await repository.getDialableNumber({
    organizationId: args.organizationId,
    agentId: args.agentId,
    fromNumber: args.fromNumber,
  });

  if (!dialableNumber) {
    throw new BadRequestError(
      "From number must belong to this organization and be linked to the selected agent"
    );
  }

  const provider = args.provider ?? dialableNumber.provider;
  const sid = args.sid ?? dialableNumber.sid;
  const trunkId = outboundTrunks[provider];

  if (!trunkId) {
    throw new BadRequestError(`LiveKit outbound trunk is not configured for ${provider}`);
  }

  const outbound = await repository.createQuickCall({
    ...args,
    provider,
    sid,
    status: CallStatus.SCHEDULED,
    mode: OutboundCallMode.quick,
    optionalData: {
      username: args.username ?? null,
      provider,
      sid,
    },
  });

  try {
    const roomName = `outbound_${outbound.outboundId}`;
    const metadata = buildOutboundMetadata(
      { ...args, provider, sid },
      outbound.outboundId
    );
    const metadataJson = JSON.stringify(metadata);
    let agentDispatch: unknown;
    try {
      agentDispatch = await dispatchClient.createDispatch(roomName, agentName, {
        metadata: metadataJson,
      });
      const livekitParticipant = await sipClient.createSipParticipant(
        trunkId,
        args.phoneNumber,
        roomName,
        {
          fromNumber: args.fromNumber,
          participantIdentity: `outbound-${outbound.outboundId}`,
          participantName: args.username,
          participantMetadata: metadataJson,
          waitUntilAnswered: false,
        }
      );

      const updated = await repository.markInProgress(
        outbound.outboundId,
        {
          username: args.username ?? null,
          provider,
          sid,
          livekitParticipant: toJsonValue(livekitParticipant),
          agentDispatch: toJsonValue(agentDispatch),
        }
      );

      return { outbound: updated, livekitParticipant, agentDispatch };
    } catch (error) {
      await cleanupAgentDispatch(dispatchClient, agentDispatch, roomName);
      throw error;
    }
  } catch (error) {
    await repository.markFailed(
      outbound.outboundId,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

async function enforcePlanQuota(
  repository: QuickOutboundCallRepository,
  organizationId: string
) {
  const usage = await repository.getMonthlyUsage?.(organizationId);
  if (!usage?.includedMinutes) return;

  if (usage.usedSeconds >= usage.includedMinutes * 60) {
    throw new BadRequestError(
      "Plan minutes exhausted for the current billing period"
    );
  }
}

async function cleanupAgentDispatch(
  dispatchClient: AgentDispatchClientLike,
  agentDispatch: unknown,
  roomName: string
) {
  const dispatchId = getDispatchId(agentDispatch);
  if (!dispatchId || !dispatchClient.deleteDispatch) return;

  try {
    await dispatchClient.deleteDispatch(dispatchId, roomName);
  } catch (cleanupError) {
    console.warn("[outbound] failed to clean up LiveKit agent dispatch", {
      roomName,
      dispatchId,
      error:
        cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
    });
  }
}

function getDispatchId(agentDispatch: unknown) {
  if (!agentDispatch || typeof agentDispatch !== "object") return null;
  const dispatch = agentDispatch as {
    id?: unknown;
    dispatchId?: unknown;
    agentDispatchId?: unknown;
  };
  const id = dispatch.id ?? dispatch.dispatchId ?? dispatch.agentDispatchId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function buildOutboundMetadata(args: QuickOutboundCallArgs, outboundId: string) {
  return {
    agent_id: args.agentId,
    outbound_id: outboundId,
    direction: "outbound",
    from_number: args.fromNumber,
    to_number: args.phoneNumber,
    provider: args.provider,
    first_message: args.firstMessage ?? null,
    system_prompt: args.systemPrompt ?? null,
    username: args.username ?? null,
  };
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return String(value);
  }
}

export async function listOutboundCalls(
  args: ListOutboundCallsArgs,
  deps: OutboundWorkflowDeps = {}
) {
  const repository = deps.repository ?? outboundCallRepository;
  const result = await repository.listForOrg(args);

  return {
    items: result.items.map(formatOutboundCall),
    count: result.count,
    filters: compact({
      agentId: args.agentId,
      status: args.status,
      mode: args.mode,
    }),
    nextCursor:
      result.items.length === args.limit
        ? result.items[result.items.length - 1]?.outboundId ?? null
        : null,
  };
}

export async function getOutboundCall(
  args: { organizationId: string; outboundId: string },
  deps: OutboundWorkflowDeps = {}
) {
  const repository = deps.repository ?? outboundCallRepository;
  const outbound = await repository.getForOrg(args.outboundId, args.organizationId);
  if (!outbound) {
    throw new NotFoundError("Outbound call not found");
  }

  return formatOutboundCall(outbound);
}

export async function cancelOutboundCall(
  args: {
    organizationId: string;
    userId: string;
    outboundId: string;
    reason?: string;
  },
  deps: OutboundWorkflowDeps = {}
) {
  const repository = deps.repository ?? outboundCallRepository;
  const outbound = await repository.getForOrg(args.outboundId, args.organizationId);
  if (!outbound) {
    throw new NotFoundError("Outbound call not found");
  }

  if (outbound.status !== CallStatus.SCHEDULED) {
    throw new BadRequestError("Only scheduled outbound calls can be cancelled");
  }

  const updated = await repository.markCancelled({
    organizationId: args.organizationId,
    userId: args.userId,
    outboundId: args.outboundId,
    reason: args.reason ?? "Cancelled by user",
  });

  return formatOutboundCall(updated);
}

export async function retryOutboundCall(
  args: {
    organizationId: string;
    userId: string;
    outboundId: string;
  },
  deps: RetryOutboundWorkflowDeps = {}
) {
  const repository = deps.repository ?? outboundCallRepository;
  const dispatchQuickCall = deps.dispatchQuickCall ?? createQuickOutboundCall;
  const outbound = await repository.getForOrg(args.outboundId, args.organizationId);
  if (!outbound) {
    throw new NotFoundError("Outbound call not found");
  }

  if (
    outbound.status !== CallStatus.FAILED &&
    outbound.status !== CallStatus.NOT_ANSWERED
  ) {
    throw new BadRequestError("Only failed or unanswered outbound calls can be retried");
  }

  if (!outbound.agentId) {
    throw new BadRequestError("Outbound call must have an agent to retry");
  }

  const optionalData = jsonObject(outbound.optionalData);
  const provider = getProvider(optionalData.provider);
  const retry = await dispatchQuickCall({
    organizationId: args.organizationId,
    userId: args.userId,
    agentId: outbound.agentId,
    phoneNumber: outbound.phoneNumber,
    fromNumber: outbound.fromNumber,
    firstMessage: outbound.firstMessage ?? undefined,
    systemPrompt: outbound.systemPrompt ?? undefined,
    username: getOptionalString(optionalData.username) ?? undefined,
    provider,
    sid: getOptionalString(optionalData.sid) ?? undefined,
  });

  return {
    sourceOutboundId: outbound.outboundId,
    retry,
  };
}

function formatOutboundCall(outbound: OutboundCallRecord) {
  const optionalData = jsonObject(outbound.optionalData);

  return {
    outboundId: outbound.outboundId,
    organizationId: outbound.organizationId,
    agentId: outbound.agentId,
    userId: outbound.userId,
    campaignId: outbound.campaignId,
    callLogId: outbound.callLogId,
    phoneNumber: outbound.phoneNumber,
    fromNumber: outbound.fromNumber,
    firstMessage: outbound.firstMessage,
    systemPrompt: outbound.systemPrompt,
    mode: outbound.mode,
    status: outbound.status,
    failureReason: getOptionalString(optionalData.failureReason),
    cancellationReason: getOptionalString(optionalData.cancellationReason),
    scheduledAt: toIsoString(outbound.scheduledAt),
    createdAt: toIsoString(outbound.createdAt),
    updatedAt: toIsoString(outbound.updatedAt),
    callLog: outbound.callLog
      ? {
          ...outbound.callLog,
          startTime: toIsoString(outbound.callLog.startTime),
          endTime: toIsoString(outbound.callLog.endTime),
        }
      : null,
  };
}

function jsonObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getProvider(value: unknown) {
  if (value === TelephonyProvider.TWILIO || value === TelephonyProvider.TELNYX) {
    return value;
  }
  return undefined;
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}
