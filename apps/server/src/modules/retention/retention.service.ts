import { kbStatus } from "../../../prisma/generated/prisma/client.js";
import prisma from "../../config/prisma.js";

const DEFAULT_TRANSCRIPT_RETENTION_DAYS = 90;
const DEFAULT_RECORDING_RETENTION_DAYS = 30;
const DEFAULT_MCP_LOG_RETENTION_DAYS = 30;
const DEFAULT_FAILED_KB_RETENTION_DAYS = 30;

export async function runRetention(now = new Date()) {
  const transcriptCutoff = daysAgo(now, readDays("TRANSCRIPT_RETENTION_DAYS", DEFAULT_TRANSCRIPT_RETENTION_DAYS));
  const recordingCutoff = daysAgo(now, readDays("RECORDING_RETENTION_DAYS", DEFAULT_RECORDING_RETENTION_DAYS));
  const mcpLogCutoff = daysAgo(now, readDays("MCP_LOG_RETENTION_DAYS", DEFAULT_MCP_LOG_RETENTION_DAYS));
  const failedKbCutoff = daysAgo(now, readDays("FAILED_KB_RETENTION_DAYS", DEFAULT_FAILED_KB_RETENTION_DAYS));

  const [transcripts, recordings, mcpLogs, failedKb] = await prisma.$transaction([
    prisma.callTranscript.deleteMany({
      where: {
        callLog: {
          endTime: { lt: transcriptCutoff },
        },
      },
    }),
    prisma.callLog.updateMany({
      where: {
        endTime: { lt: recordingCutoff },
        audioRecordingPath: { not: null },
      },
      data: { audioRecordingPath: null },
    }),
    prisma.mcpToolExecutionLog.deleteMany({
      where: { createdAt: { lt: mcpLogCutoff } },
    }),
    prisma.knowledgeSource.deleteMany({
      where: {
        status: kbStatus.ERROR,
        uploadedAt: { lt: failedKbCutoff },
      },
    }),
  ]);

  return {
    transcriptsDeleted: transcripts.count,
    recordingsDetached: recordings.count,
    mcpLogsDeleted: mcpLogs.count,
    failedKnowledgeSourcesDeleted: failedKb.count,
  };
}

function readDays(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function daysAgo(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
