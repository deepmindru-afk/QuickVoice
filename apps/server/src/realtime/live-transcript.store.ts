import type { Redis } from "ioredis";

import {
  activeCallsKey,
  callDedupKey,
  callMetadataKey,
  callStreamKey,
  parseLiveTranscriptEvent,
  type CallStartedEvent,
  type LiveCallStatus,
  type LiveTranscriptEvent,
  type TranscriptFinalEvent,
} from "./live-transcript.contract.js";

const HISTORY_BATCH_SIZE = 500;
const DEFAULT_TRANSCRIPT_TTL_SECONDS = 60 * 60;

export type LiveTranscriptRedis = Pick<
  Redis,
  | "exists"
  | "expire"
  | "get"
  | "hdel"
  | "hget"
  | "hgetall"
  | "xrange"
>;

export type CallAccess = {
  callId: string;
  roomName: string | null;
  status: LiveCallStatus;
};

export class LiveTranscriptStore {
  constructor(
    private readonly redis: LiveTranscriptRedis,
    private readonly retentionSeconds = positiveInteger(
      process.env.LIVE_TRANSCRIPT_TTL_SECONDS,
      DEFAULT_TRANSCRIPT_TTL_SECONDS
    )
  ) {}

  async listActiveCalls(organizationId: string): Promise<CallStartedEvent[]> {
    const entries = await this.redis.hgetall(activeCallsKey(organizationId));
    return Object.entries(entries).flatMap(([callId, raw]) => {
      const event = parseLiveTranscriptEvent(raw, { eventId: "0-0" });
      if (
        event?.type !== "call.started" ||
        event.organizationId !== organizationId ||
        event.callId !== callId
      ) {
        console.warn("[live-transcript] ignored malformed active-call metadata", {
          organizationId,
          callId,
        });
        return [];
      }
      return [event];
    });
  }

  async findActiveCallByRoom(
    organizationId: string,
    roomName: string
  ): Promise<CallStartedEvent | null> {
    const active = await this.listActiveCalls(organizationId);
    return active.find((call) => call.roomName === roomName) ?? null;
  }

  async getCallAccess(
    organizationId: string,
    callId: string
  ): Promise<CallAccess | null> {
    const [activeRaw, metadataRaw, streamExists] = await Promise.all([
      this.redis.hget(activeCallsKey(organizationId), callId),
      this.redis.get(callMetadataKey(organizationId, callId)),
      this.redis.exists(callStreamKey(organizationId, callId)),
    ]);

    const active = activeRaw
      ? parseLiveTranscriptEvent(activeRaw, { eventId: "0-0" })
      : null;
    if (
      active?.type === "call.started" &&
      active.organizationId === organizationId &&
      active.callId === callId
    ) {
      return { callId, roomName: active.roomName, status: "active" };
    }

    const metadata = metadataRaw
      ? parseLiveTranscriptEvent(metadataRaw, { eventId: "0-0" })
      : null;
    if (
      metadata &&
      metadata.organizationId === organizationId &&
      metadata.callId === callId
    ) {
      return {
        callId,
        roomName: metadata.roomName,
        status: metadata.type === "call.ended" ? "ended" : "active",
      };
    }

    // The stream key itself is organization-scoped and is sufficient proof of
    // access if metadata expired or a producer crashed between the two writes.
    return streamExists > 0
      ? { callId, roomName: null, status: "ended" }
      : null;
  }

  async readTranscriptHistory(
    organizationId: string,
    callId: string
  ): Promise<TranscriptFinalEvent[]> {
    const key = callStreamKey(organizationId, callId);
    const messages: TranscriptFinalEvent[] = [];
    let start = "-";

    for (;;) {
      const rows = (await this.redis.xrange(
        key,
        start,
        "+",
        "COUNT",
        HISTORY_BATCH_SIZE
      )) as Array<[string, string[]]>;

      if (rows.length === 0) break;
      for (const [streamId, fields] of rows) {
        const raw = streamField(fields, "event");
        const event = raw
          ? parseLiveTranscriptEvent(raw, { eventId: streamId })
          : null;
        if (
          !event ||
          event.organizationId !== organizationId ||
          event.callId !== callId
        ) {
          console.warn("[live-transcript] ignored malformed stream entry", {
            organizationId,
            callId,
            streamId,
          });
          continue;
        }
        if (event.type === "transcript.final") messages.push(event);
      }

      if (rows.length < HISTORY_BATCH_SIZE) break;
      start = `(${rows[rows.length - 1]![0]}`;
    }

    return messages;
  }

  async markCallStale(organizationId: string, callId: string): Promise<void> {
    await this.redis.hdel(activeCallsKey(organizationId), callId);
    await Promise.all([
      this.redis.expire(
        callStreamKey(organizationId, callId),
        this.retentionSeconds
      ),
      this.redis.expire(
        callMetadataKey(organizationId, callId),
        this.retentionSeconds
      ),
      this.redis.expire(
        callDedupKey(organizationId, callId),
        this.retentionSeconds
      ),
    ]);
  }
}

export function parsePublishedEvent(raw: string): LiveTranscriptEvent | null {
  return parseLiveTranscriptEvent(raw);
}

function streamField(fields: string[], fieldName: string): string | null {
  for (let index = 0; index < fields.length; index += 2) {
    if (fields[index] === fieldName) return fields[index + 1] ?? null;
  }
  return null;
}

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
