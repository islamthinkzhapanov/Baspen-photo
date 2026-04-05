import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Create a dedicated Redis subscriber connection.
 * Each SSE client needs its own subscriber (Redis constraint).
 */
export function createSubscriber() {
  return new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
}

/**
 * Create a Redis publisher connection (shared).
 */
let publisher: IORedis | null = null;
export function getPublisher() {
  if (!publisher) {
    publisher = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  }
  return publisher;
}

/** Channel name for new photo matches in an event */
export function matchChannel(eventId: string) {
  return `matches:${eventId}`;
}

/** Channel for new photos ready in an event */
export function photoReadyChannel(eventId: string) {
  return `photo-ready:${eventId}`;
}

export interface MatchNotification {
  participantSessionToken: string;
  photoId: string;
  thumbnailPath: string;
  watermarkedPath: string;
  similarity: number;
  width: number | null;
  height: number | null;
}

export interface PhotoReadyNotification {
  photoId: string;
  thumbnailPath: string;
  watermarkedPath: string;
  width: number | null;
  height: number | null;
}
