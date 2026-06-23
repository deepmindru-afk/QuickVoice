import { Queue } from "bullmq";
import { Redis } from "ioredis";

export type OutboundBatchJobName =
  | "import"
  | "dispatch-campaign"
  | "dispatch-call";

export interface OutboundBatchJobData {
  campaignId?: string;
  outboundId?: string;
}

let outboundBatchQueue: Queue<OutboundBatchJobData, void, OutboundBatchJobName> | undefined;
let outboundBatchRedisConnection: Redis | undefined;

export function getOutboundBatchQueue() {
  outboundBatchQueue ??= new Queue<
    OutboundBatchJobData,
    void,
    OutboundBatchJobName
  >("outbound-batch", {
    connection: getOutboundBatchRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });
  return outboundBatchQueue;
}

function getOutboundBatchRedisConnection() {
  outboundBatchRedisConnection ??= new Redis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    { maxRetriesPerRequest: null }
  );
  return outboundBatchRedisConnection;
}
