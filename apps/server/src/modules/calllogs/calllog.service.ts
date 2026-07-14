import { NotFoundError } from "../../common/errors/notFound.js";
import { livekitRoomServiceClient } from "../../config/livekit.js";
import { generateDownloadUrl } from "../../config/s3.js";
import { reportCallMinutesUsage } from "../billing/metered-usage.service.js";
import * as calllogRepository from "./calllog.repository.js";
import type {
  IngestCallLogArgs,
  ListCallLogsArgs,
  ListTranscriptsArgs,
} from "./calllog.schema.js";

type RecordingSigner = (key: string) => Promise<string>;
type CallWithRecording = { audioRecordingPath: string | null };

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const signCallRecordingUrl = async <T extends CallWithRecording>(
  call: T,
  signer: RecordingSigner = generateDownloadUrl
): Promise<T> => {
  if (!call.audioRecordingPath || isHttpUrl(call.audioRecordingPath)) {
    return call;
  }

  return {
    ...call,
    audioRecordingPath: await signer(call.audioRecordingPath),
  };
};

export const ingestCallLog = async (args: IngestCallLogArgs) =>{
  const callLog = await calllogRepository.saveCallLog(args);
  await reportCallMinutesUsage({
    organizationId: args.organizationId,
    callId: args.callId,
    durationSeconds: args.durationSeconds,
    timestamp: new Date(args.endTime),
  }).catch((error) => {
    console.warn("[billing] failed to report Stripe call usage", {
      organizationId: args.organizationId,
      callId: args.callId,
      error: error instanceof Error ? error.message : String(error),
    });
  });
  return callLog;
};

export const listCallLogs = async (args: ListCallLogsArgs) => {
  // Repository over-fetches by one row; we trim here and hand back the
  // trailing callId as the next cursor so the caller can walk forward.
  const rows = await calllogRepository.listByOrg(args);
  const hasMore = rows.length > args.limit;
  const items = hasMore ? rows.slice(0, args.limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.callId : null;
  return {
    items: await Promise.all(items.map((item) => signCallRecordingUrl(item))),
    nextCursor,
  };
};

export const getCallLog = async (organizationId: string, callId: string) => {
  const row = await calllogRepository.getCallByIdForOrg(callId, organizationId);
  if (!row) {
    throw new NotFoundError("Call log not found");
  }
  return signCallRecordingUrl(row);
};

export const getTranscripts = async (args: ListTranscriptsArgs) => {
  const rows = await calllogRepository.getTranscriptsByCallId(args);
  const hasMore = rows.length > args.limit;
  const items = hasMore ? rows.slice(0, args.limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.callTransId : null;
  return { items, nextCursor };
};

type LiveKitRoomClient = {
  listRooms: () => Promise<unknown[]>;
  deleteRoom: (roomName: string) => Promise<unknown>;
};

export type LiveCallRoom = {
  roomName: string;
  callId: string;
  direction: "inbound" | "outbound" | "unknown";
  participantCount: number;
  startedAt: string | null;
};

export const listLiveCalls = async (
  organizationId: string,
  roomClient: LiveKitRoomClient = livekitRoomServiceClient as LiveKitRoomClient
) => {
  const rooms = await roomClient.listRooms();
  const normalized = rooms
    .map(normalizeLiveRoom)
    .filter((room): room is LiveCallRoom => room !== null);
  const scoped = await Promise.all(
    normalized.map(async (room) =>
      (await calllogRepository.liveRoomBelongsToOrg(organizationId, room.roomName))
        ? room
        : null
    )
  );
  return scoped
    .filter((room): room is LiveCallRoom => room !== null)
    .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
};

export const endLiveCall = async (
  organizationId: string,
  roomName: string,
  roomClient: LiveKitRoomClient = livekitRoomServiceClient as LiveKitRoomClient
) => {
  const normalizedRoomName = roomName.trim();
  if (!normalizedRoomName) {
    throw new NotFoundError("Live call room not found");
  }
  const belongsToOrg = await calllogRepository.liveRoomBelongsToOrg(
    organizationId,
    normalizedRoomName
  );
  if (!belongsToOrg) {
    throw new NotFoundError("Live call room not found");
  }
  await roomClient.deleteRoom(normalizedRoomName);
  return { status: "ended" as const, roomName: normalizedRoomName };
};

function normalizeLiveRoom(room: unknown): LiveCallRoom | null {
  if (!room || typeof room !== "object") return null;
  const record = room as Record<string, unknown>;
  const roomName = stringValue(record.name ?? record.roomName);
  if (!roomName || roomName.startsWith("preview-")) return null;

  return {
    roomName,
    callId: callIdFromRoomName(roomName),
    direction: roomName.startsWith("outbound_") ? "outbound" : "inbound",
    participantCount: numberValue(record.numParticipants ?? record.num_participants) ?? 0,
    startedAt: liveKitTimestamp(record.creationTime ?? record.creation_time ?? record.createdAt),
  };
}

function callIdFromRoomName(roomName: string) {
  return roomName.startsWith("outbound_") ? roomName.slice("outbound_".length) : roomName;
}

function liveKitTimestamp(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "bigint") return new Date(Number(value) * 1000).toISOString();
  if (typeof value === "number") {
    return new Date((value > 10_000_000_000 ? value : value * 1000)).toISOString();
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return liveKitTimestamp(numeric);
    const time = Date.parse(value);
    return Number.isFinite(time) ? new Date(time).toISOString() : null;
  }
  return null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export const deleteCallLog = async (
  organizationId: string,
  callId: string
) => {
  const ok = await calllogRepository.deleteCallLog(callId, organizationId);
  if (!ok) {
    throw new NotFoundError("Call log not found");
  }
};
