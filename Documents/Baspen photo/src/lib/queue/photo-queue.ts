import { Queue } from "bullmq";
import { createRedisConnection } from "./connection";

export const PHOTO_QUEUE_NAME = "photo-processing";

export interface PhotoJobData {
  photoId: string;
  eventId: string;
  storagePath: string;
}

let photoQueue: Queue<PhotoJobData> | null = null;

export function getPhotoQueue(): Queue<PhotoJobData> {
  if (!photoQueue) {
    photoQueue = new Queue<PhotoJobData>(PHOTO_QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }
  return photoQueue;
}

export async function enqueuePhotoProcessing(data: PhotoJobData) {
  const queue = getPhotoQueue();
  return queue.add("process-photo", data, {
    priority: 1,
  });
}
