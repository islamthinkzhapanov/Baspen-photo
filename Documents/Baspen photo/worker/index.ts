import { Worker } from "bullmq";
import { createRedisConnection } from "../src/lib/queue/connection";
import { PHOTO_QUEUE_NAME } from "../src/lib/queue/photo-queue";
import { processPhoto } from "./jobs/process-photo";

console.log("[worker] Starting photo processing worker...");

const worker = new Worker(
  PHOTO_QUEUE_NAME,
  async (job) => {
    console.log(`[worker] Processing job ${job.id}: photo ${job.data.photoId}`);
    const result = await processPhoto(job);
    console.log(
      `[worker] Done ${job.id}: ${result.facesDetected} faces detected`
    );
    return result;
  },
  {
    connection: createRedisConnection(),
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] Worker error:", err);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("[worker] Shutting down...");
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[worker] Shutting down...");
  await worker.close();
  process.exit(0);
});

console.log("[worker] Ready, waiting for jobs...");
