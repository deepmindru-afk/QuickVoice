import { Worker } from "bullmq";
import { Redis } from "ioredis";

import {
  dispatchBatchCampaign,
  dispatchBatchOutboundCall,
  importBatchCampaignRecipients,
} from "../modules/outbound/outbound-batch.service.js";
import type {
  OutboundBatchJobData,
  OutboundBatchJobName,
} from "../queues/outbound-batch.queue.js";

let redisConnection: Redis | undefined;

export async function processOutboundBatchJob(job: {
  name: OutboundBatchJobName;
  data: OutboundBatchJobData;
}) {
  if (job.name === "import") {
    if (!job.data.campaignId) throw new Error("campaignId is required");
    await importBatchCampaignRecipients({ campaignId: job.data.campaignId });
    return;
  }

  if (job.name === "dispatch-campaign") {
    if (!job.data.campaignId) throw new Error("campaignId is required");
    await dispatchBatchCampaign({ campaignId: job.data.campaignId });
    return;
  }

  if (job.name === "dispatch-call") {
    if (!job.data.outboundId) throw new Error("outboundId is required");
    await dispatchBatchOutboundCall({ outboundId: job.data.outboundId });
    return;
  }

  throw new Error(`Unsupported outbound batch job: ${job.name}`);
}

export const outboundBatchWorker = new Worker<
  OutboundBatchJobData,
  void,
  OutboundBatchJobName
>("outbound-batch", processOutboundBatchJob, {
  connection: getRedisConnection(),
  concurrency: 5,
});

outboundBatchWorker.on("failed", (job, err) => {
  console.error("[outbound-batch-worker] job failed", {
    jobId: job?.id,
    name: job?.name,
    error: err.message,
  });
});

outboundBatchWorker.on("completed", (job) => {
  console.log(`[outbound-batch-worker] job ${job.id} completed`);
});

function getRedisConnection() {
  redisConnection ??= new Redis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    { maxRetriesPerRequest: null }
  );
  return redisConnection;
}
