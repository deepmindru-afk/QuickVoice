import { NotFoundError } from "../../common/errors/notFound.js";
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

export const deleteCallLog = async (
  organizationId: string,
  callId: string
) => {
  const ok = await calllogRepository.deleteCallLog(callId, organizationId);
  if (!ok) {
    throw new NotFoundError("Call log not found");
  }
};
