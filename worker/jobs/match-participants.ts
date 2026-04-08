import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const SIMILARITY_THRESHOLD = parseFloat(
  process.env.FACE_SIMILARITY_THRESHOLD || "0.27"
);

const dbClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(dbClient);

let publisher: IORedis | null = null;
function getPublisher() {
  if (!publisher) {
    publisher = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  }
  return publisher;
}

interface MatchResult {
  participant_id: string;
  session_token: string;
  similarity: number;
  [key: string]: unknown;
}

/**
 * After a photo is processed, check if it matches any active participants.
 * "Active" = participants who searched within the last 24 hours.
 *
 * For each match:
 * 1. Insert into participant_matches
 * 2. Publish match notification via Redis pub/sub
 */
export async function matchParticipants(
  photoId: string,
  eventId: string,
  thumbnailPath: string,
  watermarkedPath: string,
  width: number | null,
  height: number | null
) {
  // Find active participants with selfie embeddings in this event
  // Match against all face embeddings of this photo
  const matches = await db.execute<MatchResult>(sql`
    WITH photo_faces AS (
      SELECT embedding FROM face_embeddings WHERE photo_id = ${photoId}
    ),
    active_participants AS (
      SELECT id, session_token, selfie_embedding
      FROM participants
      WHERE event_id = ${eventId}
        AND selfie_embedding IS NOT NULL
        AND last_search_at > NOW() - INTERVAL '24 hours'
    )
    SELECT DISTINCT ON (ap.id)
      ap.id AS participant_id,
      ap.session_token,
      MAX(1 - (ap.selfie_embedding <=> pf.embedding)) AS similarity
    FROM active_participants ap
    CROSS JOIN photo_faces pf
    GROUP BY ap.id, ap.session_token
    HAVING MAX(1 - (ap.selfie_embedding <=> pf.embedding)) > ${SIMILARITY_THRESHOLD}
    ORDER BY ap.id, similarity DESC
  `);

  if (!matches || (matches as unknown as MatchResult[]).length === 0) return 0;

  const matchRows = matches as unknown as MatchResult[];
  const pub = getPublisher();
  const channel = `matches:${eventId}`;

  for (const match of matchRows) {
    // Cache the match
    try {
      await db.execute(sql`
        INSERT INTO participant_matches (id, participant_id, photo_id, similarity, created_at)
        VALUES (gen_random_uuid(), ${match.participant_id}, ${photoId}, ${match.similarity}, NOW())
        ON CONFLICT (participant_id, photo_id) DO UPDATE SET similarity = EXCLUDED.similarity
      `);
    } catch (err) {
      console.error(`[match] Failed to cache match:`, err);
    }

    // Publish realtime notification
    pub.publish(
      channel,
      JSON.stringify({
        participantSessionToken: match.session_token,
        photoId,
        thumbnailPath,
        watermarkedPath,
        similarity: match.similarity,
        width,
        height,
      })
    );
  }

  // Also publish photo-ready event for anyone viewing the event
  pub.publish(
    `photo-ready:${eventId}`,
    JSON.stringify({ photoId, thumbnailPath, watermarkedPath, width, height })
  );

  return matchRows.length;
}

/**
 * Publish photo-ready notification (even if no participant matches).
 */
export async function publishPhotoReady(
  eventId: string,
  photoId: string,
  thumbnailPath: string,
  watermarkedPath: string,
  width: number | null,
  height: number | null
) {
  const pub = getPublisher();
  pub.publish(
    `photo-ready:${eventId}`,
    JSON.stringify({ photoId, thumbnailPath, watermarkedPath, width, height })
  );
}
