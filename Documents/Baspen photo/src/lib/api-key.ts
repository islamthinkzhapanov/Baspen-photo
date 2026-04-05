/**
 * API Key utilities for camera auto-upload authentication.
 *
 * Key format: bsp_<32 random hex chars>
 * Storage: SHA-256 hash in DB, first 8 chars as prefix for display.
 */

import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const KEY_PREFIX = "bsp_";

export interface ApiKeyInfo {
  userId: string;
  eventId: string;
  keyId: string;
}

/**
 * Generate a new API key. Returns the raw key (shown once) and its hash.
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const random = randomBytes(32).toString("hex");
  const rawKey = `${KEY_PREFIX}${random}`;
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);
  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hash an API key with SHA-256.
 */
export function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Validate an API key from a request header.
 * Returns the key info if valid, null otherwise.
 */
export async function validateApiKey(
  authHeader: string | null
): Promise<ApiKeyInfo | null> {
  if (!authHeader) return null;

  // Accept "Bearer bsp_xxx" or just "bsp_xxx"
  const rawKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!rawKey.startsWith(KEY_PREFIX)) return null;

  const keyHash = hashKey(rawKey);

  const [key] = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      eventId: apiKeys.eventId,
      isRevoked: apiKeys.isRevoked,
      expiresAt: apiKeys.expiresAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isRevoked, false)))
    .limit(1);

  if (!key) return null;

  // Check expiry
  if (key.expiresAt && key.expiresAt < new Date()) return null;

  // Update last used timestamp (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .then(() => {})
    .catch(() => {});

  return {
    userId: key.userId,
    eventId: key.eventId,
    keyId: key.id,
  };
}
