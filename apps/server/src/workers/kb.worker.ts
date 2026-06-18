import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { generateDownloadUrl } from "../config/s3.js";
import { assertKbProcessingSucceeded } from "../modules/kb/kb-processing-result.js";
import * as kbRepository from "../modules/kb/kb.repository.js";
import type { KbJobData, KbJobName } from "../queues/kb.queue.js";

const AI_API_URL = process.env.AI_API_URL ?? "http://localhost:5555";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

export const kbWorker = new Worker<KbJobData, void, KbJobName>(
  "kb-ingest",
  async (job) => {
    const { kbIds, agentId, organizationId, documents } = job.data;

    // 1. Generate presigned download URLs for S3-backed documents
    const enriched = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        presignedUrl: doc.s3Key ? await generateDownloadUrl(doc.s3Key) : undefined,
      }))
    );

    // 2. Call the apps/ai FastAPI processing endpoint
    const res = await fetch(`${AI_API_URL}/kb/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_API_KEY,
      },
      body: JSON.stringify({ agentId, organizationId, documents: enriched }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`KB processing failed (${res.status}): ${body}`);
    }

    const body = await res.json();
    assertKbProcessingSucceeded(body, kbIds);

    // 3. Mark all sources as ACTIVE
    await kbRepository.markActive(kbIds, agentId);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

kbWorker.on("failed", async (job, err) => {
  if (!job) return;
  console.error(`[kb-worker] job ${job.id} failed permanently`, err.message);
  const { kbIds } = job.data;
  await kbRepository.markError(kbIds).catch((e) =>
    console.error("[kb-worker] markError failed", e)
  );
});

kbWorker.on("completed", (job) => {
  console.log(`[kb-worker] job ${job.id} completed`);
});
