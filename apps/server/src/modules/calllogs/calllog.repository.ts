import { Prisma } from "../../../prisma/generated/prisma/client.js";
import prisma from "../../config/prisma.js";
import { redactJson, redactText } from "../../lib/redaction.js";
import type {
  IngestCallLogArgs,
  ListCallLogsArgs,
  ListTranscriptsArgs,
} from "./calllog.schema.js";

// Create a CallLog, its CallTranscript children, and — best-effort — link the
// originating OutboundCall in one transaction. The OutboundCall linkage is
// deliberately non-fatal: a stale or cross-org outboundId logs a warning and
// the CallLog is still persisted (per product decision #4).
export const saveCallLog = async (input: IngestCallLogArgs) => {
  const redactPii = process.env.CALL_LOG_PII_REDACTION !== "false";
  const { callerId, metadata } = buildCallLogIdentityFields(input, redactPii);

  return prisma.$transaction(async (tx) => {
    const callLog = await tx.callLog.create({
      data: {
        callId: input.callId,
        organizationId: input.organizationId,
        agentId: input.agentId,
        userId: input.userId,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        durationSeconds: input.durationSeconds,
        status: input.status,
        direction: input.direction,
        audioRecordingPath: input.recordingSid,
        callerId,
        metadata,
        dataExtracted: redactPii ? redactJson(input.extractedData) : input.extractedData,
        dataEvaluation: redactPii ? redactJson(input.evaluatedData) : input.evaluatedData,
        
      },
    });
    await tx.callTranscript.createMany({
      data: input.transcripts.map((transcript) => ({
        callLogId: callLog.callId,
        speaker: transcript.role,
        messageText: redactPii ? redactText(transcript.message) : transcript.message,
        timestamp: new Date(transcript.timestamp),
        isPiiRedacted: redactPii,
      })),
    });

    const outboundId = input.metadata?.outboundId ?? null;
    if (outboundId) {
      // updateMany with the composite {outboundId, organizationId} predicate
      // is the tenant-safe write — a row in a different org yields count: 0
      // instead of being updated, same pattern as linkAgent in phone.repository.
      const linked = await tx.outboundCall.updateMany({
        where: { outboundId, organizationId: input.organizationId },
        data: { callLogId: callLog.callId, status: input.status },
      });
      if (linked.count === 0) {
        console.warn("[calllogs] ingest: outboundId not linkable", {
          outboundId,
          callId: callLog.callId,
          organizationId: input.organizationId,
        });
      }
    }

    return callLog;
  });
};

export function buildCallLogIdentityFields(input: IngestCallLogArgs, redactPii: boolean) {
  // The external party's number goes into callerId. On inbound it's the
  // caller; on outbound it's the callee. Keep structured phone fields raw so
  // call-log tables and details can show the actual number; redact only
  // free-form text that may contain incidental PII.
  const callerId = input.direction === "inbound" ? input.fromNumber : input.toNumber;
  const summary = input.metadata?.summary ?? "";
  const intent = input.metadata?.intent ?? "";
  const baseMetadata = (redactPii
    ? redactJson(jsonObject(input.metadata))
    : jsonObject(input.metadata)) as Prisma.InputJsonObject;
  const metadata = {
    ...baseMetadata,
    summary: redactPii ? redactText(summary) : summary,
    intent: redactPii ? redactText(intent) : intent,
    fromNumber: input.fromNumber,
    toNumber: input.toNumber,
    provider: input.provider,
  } satisfies Prisma.InputJsonObject;

  return { callerId, metadata };
}

function jsonObject(value: unknown): Prisma.InputJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Prisma.InputJsonObject;
}

export const listByOrg = async (args: ListCallLogsArgs) => {
  const {
    organizationId,
    agentId,
    status,
    direction,
    from,
    to,
    limit,
    cursor,
  } = args;

  const where: Prisma.CallLogWhereInput = {
    organizationId,
    deleted: false,
    ...(agentId && { agentId }),
    ...(status && { status }),
    ...(direction && { direction }),
    ...((from || to) && {
      startTime: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
  };

  // Over-fetch by 1 so the service can decide whether a next page exists
  // without a second count query. Cursor pagination is stable because
  // (startTime, callId) is a total order.
  return prisma.callLog.findMany({
    where,
    orderBy: [{ startTime: "desc" }, { callId: "desc" }],
    take: limit + 1,
    ...(cursor && { cursor: { callId: cursor }, skip: 1 }),
  });
};

export const getCallByIdForOrg = async (
  callId: string,
  organizationId: string
) => {
  // findFirst with the composite {callId, organizationId} predicate prevents
  // callers from reading a row that belongs to another org.
  return prisma.callLog.findFirst({
    where: { callId, organizationId, deleted: false },
  });
};

export const getTranscriptsByCallId = async (args: ListTranscriptsArgs) => {
  const { callId, organizationId, limit, cursor } = args;

  // Join through callLog so a transcript belonging to another org or a
  // soft-deleted call is never returned.
  return prisma.callTranscript.findMany({
    where: {
      callLogId: callId,
      callLog: { organizationId, deleted: false },
    },
    orderBy: { timestamp: "asc" },
    take: limit + 1,
    ...(cursor && { cursor: { callTransId: cursor }, skip: 1 }),
  });
};

export const liveRoomBelongsToOrg = async (
  organizationId: string,
  roomName: string
) => {
  if (roomName.startsWith("outbound_")) {
    const outboundId = roomName.slice("outbound_".length);
    const count = await prisma.outboundCall.count({
      where: { outboundId, organizationId },
    });
    return count > 0;
  }

  const numbers = await prisma.phoneNumber.findMany({
    where: { organizationId },
    select: { number: true },
  });
  return numbers.some((number) => roomName.includes(number.number));
};

export const deleteCallLog = async (callId: string, organizationId: string) => {
  // Soft delete: flip `deleted=true`. Idempotent — a row already deleted
  // yields count: 0, which the service surfaces as NotFoundError.
  const result = await prisma.callLog.updateMany({
    where: { callId, organizationId, deleted: false },
    data: { deleted: true },
  });
  return result.count > 0;
};
