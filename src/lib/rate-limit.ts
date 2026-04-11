import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

/**
 * Sliding window rate limiter using Redis INCR + EXPIRE.
 *
 * @param key - unique key for the rate limit bucket (e.g. "rl:register:127.0.0.1")
 * @param limit - max requests allowed in the window
 * @param windowSeconds - window duration in seconds
 * @returns { allowed, remaining, retryAfter }
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (current > limit) {
    const ttl = await redis.ttl(key);
    return { allowed: false, remaining: 0, retryAfter: ttl > 0 ? ttl : windowSeconds };
  }

  return { allowed: true, remaining: limit - current, retryAfter: 0 };
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
