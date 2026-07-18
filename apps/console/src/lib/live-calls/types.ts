import type { LiveCallRoom } from "@/src/lib/api/resources/calls";

export type LiveCallDirection = LiveCallRoom["direction"];
export type LiveCallSpeaker = "user" | "agent";

interface LiveEventBase {
  version: 1;
  eventId: string;
  organizationId: string;
  callId: string;
  roomName: string;
  occurredAt: string;
}

export interface LiveCallMetadata {
  agentId?: string | null;
  agentName?: string | null;
  direction?: LiveCallDirection;
  callerId?: string | null;
  calleeId?: string | null;
  fromNumber?: string | null;
  toNumber?: string | null;
  participantCount?: number;
}

export interface LiveCallStartedEvent extends LiveEventBase, LiveCallMetadata {
  type: "call.started";
  status: "active";
  startedAt: string;
  metadata?: LiveCallMetadata;
}

export interface LiveCallUpdatedEvent extends LiveEventBase, LiveCallMetadata {
  type: "call.updated";
  status: "active";
  startedAt?: string;
  metadata?: LiveCallMetadata;
}

export interface LiveCallEndedEvent extends LiveEventBase, LiveCallMetadata {
  type: "call.ended";
  status: "ended";
  endedAt: string;
  reason?: string | null;
}

export interface LiveTranscriptMessage extends LiveEventBase {
  type: "transcript.final";
  messageId: string;
  speaker: LiveCallSpeaker;
  text: string;
  timestamp: string;
}

export type LiveCallWatchAck =
  | {
      ok: true;
      callId: string;
      messages: LiveTranscriptMessage[];
      status: "active" | "ended";
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

export type LiveCallUnwatchAck =
  | { ok: true; callId: string }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

export interface LiveCallsServerEvents {
  "live-call:started": (event: LiveCallStartedEvent) => void;
  "live-call:updated": (event: LiveCallUpdatedEvent) => void;
  "live-call:ended": (event: LiveCallEndedEvent) => void;
  "live-transcript:message": (event: LiveTranscriptMessage) => void;
}

export interface LiveCallsClientEvents {
  "live-call:watch": (
    payload: { callId: string },
    acknowledge: (ack: LiveCallWatchAck) => void
  ) => void;
  "live-call:unwatch": (
    payload: { callId: string },
    acknowledge: (ack: LiveCallUnwatchAck) => void
  ) => void;
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object"
    ? (value as UnknownRecord)
    : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function optionalString(value: unknown): string | null | undefined {
  return value === null ? null : nonEmptyString(value) ?? undefined;
}

function direction(value: unknown): LiveCallDirection | undefined {
  return value === "inbound" || value === "outbound" || value === "unknown"
    ? value
    : undefined;
}

export function isLifecycleEventForOrganization(
  value: unknown,
  organizationId: string
): value is LiveCallStartedEvent | LiveCallUpdatedEvent | LiveCallEndedEvent {
  const event = record(value);
  return (
    event?.version === 1 &&
    event.organizationId === organizationId &&
    nonEmptyString(event.eventId) !== null &&
    nonEmptyString(event.callId) !== null &&
    nonEmptyString(event.roomName) !== null &&
    nonEmptyString(event.occurredAt) !== null
  );
}

export function liveCallFromLifecycle(
  event: LiveCallStartedEvent | LiveCallUpdatedEvent,
  existing?: LiveCallRoom
): LiveCallRoom {
  const nested = record(event.metadata);
  const startedAt =
    nonEmptyString(event.startedAt) ?? existing?.startedAt ?? event.occurredAt;

  return {
    roomName: event.roomName,
    callId: event.callId,
    status: "active",
    direction:
      direction(event.direction) ??
      direction(nested?.direction) ??
      existing?.direction ??
      "unknown",
    participantCount:
      (typeof event.participantCount === "number"
        ? event.participantCount
        : typeof nested?.participantCount === "number"
          ? nested.participantCount
          : existing?.participantCount) ?? 0,
    startedAt,
    agentId:
      optionalString(event.agentId) ??
      optionalString(nested?.agentId) ??
      existing?.agentId ??
      null,
    agentName:
      optionalString(event.agentName) ??
      optionalString(nested?.agentName) ??
      existing?.agentName ??
      null,
    callerId:
      optionalString(event.callerId) ??
      optionalString(nested?.callerId) ??
      existing?.callerId ??
      null,
    calleeId:
      optionalString(event.calleeId) ??
      optionalString(nested?.calleeId) ??
      existing?.calleeId ??
      null,
    fromNumber:
      optionalString(event.fromNumber) ??
      optionalString(nested?.fromNumber) ??
      existing?.fromNumber ??
      null,
    toNumber:
      optionalString(event.toNumber) ??
      optionalString(nested?.toNumber) ??
      existing?.toNumber ??
      null,
  };
}

export function normalizeTranscriptMessage(
  value: unknown,
  organizationId?: string,
  callId?: string
): LiveTranscriptMessage | null {
  const message = record(value);
  if (
    message?.version !== 1 ||
    (organizationId !== undefined && message.organizationId !== organizationId) ||
    (callId !== undefined && message.callId !== callId)
  ) {
    return null;
  }

  const eventId = nonEmptyString(message.eventId);
  const resolvedOrganizationId = nonEmptyString(message.organizationId);
  const resolvedCallId = nonEmptyString(message.callId);
  const roomName = nonEmptyString(message.roomName);
  const occurredAt = nonEmptyString(message.occurredAt);
  const messageId = nonEmptyString(message.messageId);
  const text = nonEmptyString(message.text);
  const timestamp = nonEmptyString(message.timestamp);
  const speaker =
    message.speaker === "user" || message.speaker === "agent"
      ? message.speaker
      : null;

  if (
    !eventId ||
    !resolvedOrganizationId ||
    !resolvedCallId ||
    !roomName ||
    !occurredAt ||
    !messageId ||
    !text ||
    !timestamp ||
    !speaker
  ) {
    return null;
  }

  return {
    type: "transcript.final",
    version: 1,
    eventId,
    organizationId: resolvedOrganizationId,
    callId: resolvedCallId,
    roomName,
    occurredAt,
    messageId,
    speaker,
    text,
    timestamp,
  };
}

function streamIdParts(eventId: string): [number, number] | null {
  const match = /^(\d+)-(\d+)$/.exec(eventId);
  if (!match) return null;
  const milliseconds = Number(match[1]);
  const sequence = Number(match[2]);
  return Number.isSafeInteger(milliseconds) && Number.isSafeInteger(sequence)
    ? [milliseconds, sequence]
    : null;
}

export function compareTranscriptMessages(
  left: LiveTranscriptMessage,
  right: LiveTranscriptMessage
) {
  const leftStreamId = streamIdParts(left.eventId);
  const rightStreamId = streamIdParts(right.eventId);
  if (leftStreamId && rightStreamId) {
    return (
      leftStreamId[0] - rightStreamId[0] ||
      leftStreamId[1] - rightStreamId[1]
    );
  }

  const byTime = Date.parse(left.timestamp) - Date.parse(right.timestamp);
  return (Number.isFinite(byTime) ? byTime : 0) ||
    left.eventId.localeCompare(right.eventId);
}

export function mergeTranscriptMessages(
  current: LiveTranscriptMessage[],
  incoming: LiveTranscriptMessage[]
) {
  const byMessageId = new Map<string, LiveTranscriptMessage>();
  const bySyntheticFingerprint = new Map<string, LiveTranscriptMessage>();
  for (const message of [...current, ...incoming]) {
    const fingerprint = transcriptFingerprint(message);
    const existing = bySyntheticFingerprint.get(fingerprint);
    if (existing && (isSyntheticMessage(existing) || isSyntheticMessage(message))) {
      byMessageId.delete(existing.messageId);
      const preferred = preferTranscriptMessage(existing, message);
      bySyntheticFingerprint.set(fingerprint, preferred);
      byMessageId.set(preferred.messageId, preferred);
      continue;
    }
    bySyntheticFingerprint.set(fingerprint, message);
    byMessageId.set(message.messageId, message);
  }
  return [...byMessageId.values()].sort(compareTranscriptMessages);
}

function transcriptFingerprint(message: LiveTranscriptMessage) {
  return [
    message.organizationId,
    message.callId,
    message.speaker,
    message.text.trim().replace(/\s+/g, " ").toLowerCase(),
  ].join(":");
}

function isSyntheticMessage(message: LiveTranscriptMessage) {
  return (
    message.messageId.startsWith("user-transcript-") ||
    message.messageId.startsWith("agent-transcript-")
  );
}

function preferTranscriptMessage(
  existing: LiveTranscriptMessage,
  incoming: LiveTranscriptMessage
) {
  const existingSynthetic = isSyntheticMessage(existing);
  const incomingSynthetic = isSyntheticMessage(incoming);
  if (existingSynthetic !== incomingSynthetic) {
    return existingSynthetic ? incoming : existing;
  }
  return compareTranscriptMessages(existing, incoming) <= 0 ? existing : incoming;
}
