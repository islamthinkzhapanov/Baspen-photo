import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import IORedis from "ioredis";
import { searchFaces, getCollectionId } from "../../src/lib/rekognition/client";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const dbClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(dbClient);

let publisher: IORedis | null = null;
function getPublisher() {
  if (!publisher) {
    publisher = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  }
  return publisher;
}

/**
 * After a photo is processed, check if it matches any active participants.
 * "Active" = participants who searched within the last 24 hours.
 *
 * Uses Rekognition searchFaces: for each indexed photo face, search the
 * collection for matching selfie faces (externalImageId starts with "selfie-").
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
  const collectionId = getCollectionId(eventId);

  // Get all Rekognition face IDs for this photo
  const photoFaces = await db.execute<{
    rekognition_face_id: string;
  }>(sql`
    SELECT rekognition_face_id
    FROM face_embeddings
    WHERE photo_id = ${photoId}
      AND rekognition_face_id IS NOT NULL
  `);

  if (!photoFaces || (photoFaces as unknown as { rekognition_face_id: string }[]).length === 0) {
    await publishPhotoReady(eventId, photoId, thumbnailPath, watermarkedPath, width, height);
    return 0;
  }

  // Get active participants (searched within 24h) with Rekognition face IDs
  const activeParticipants = await db.execute<{
    id: string;
    session_token: string;
    rekognition_face_id: string;
  }>(sql`
    SELECT id, session_token, rekognition_face_id
    FROM participants
    WHERE event_id = ${eventId}
      AND rekognition_face_id IS NOT NULL
      AND last_search_at > NOW() - INTERVAL '24 hours'
  `);

  if (!activeParticipants || (activeParticipants as unknown as { id: string }[]).length === 0) {
    await publishPhotoReady(eventId, photoId, thumbnailPath, watermarkedPath, width, height);
    return 0;
  }

  // Build a set of active participant Rekognition face IDs for fast lookup
  const participantRows = activeParticipants as unknown as {
    id: string;
    session_token: string;
    rekognition_face_id: string;
  }[];
  const participantByFaceId = new Map(
    participantRows.map((p) => [p.rekognition_face_id, p])
  );

  const pub = getPublisher();
  const channel = `matches:${eventId}`;
  const matched = new Set<string>();

  // For each photo face, search Rekognition for matching faces in the collection
  for (const row of photoFaces as unknown as { rekognition_face_id: string }[]) {
    const faceMatches = await searchFaces(collectionId, row.rekognition_face_id);

    for (const match of faceMatches) {
      // Only interested in selfie faces
      if (!match.externalImageId.startsWith("selfie-")) continue;

      const participant = participantByFaceId.get(match.faceId);
      if (!participant || matched.has(participant.id)) continue;

      matched.add(participant.id);
      const similarity = match.similarity;

      // Cache the match
      try {
        await db.execute(sql`
          INSERT INTO participant_matches (id, participant_id, photo_id, similarity, created_at)
          VALUES (gen_random_uuid(), ${participant.id}, ${photoId}, ${similarity}, NOW())
          ON CONFLICT (participant_id, photo_id) DO UPDATE SET similarity = EXCLUDED.similarity
        `);
      } catch (err) {
        console.error(`[match] Failed to cache match:`, err);
      }

      // Publish realtime notification
      pub.publish(
        channel,
        JSON.stringify({
          participantSessionToken: participant.session_token,
          photoId,
          thumbnailPath,
          watermarkedPath,
          similarity,
          width,
          height,
        })
      );
    }
  }

  // Also publish photo-ready event for anyone viewing the event
  pub.publish(
    `photo-ready:${eventId}`,
    JSON.stringify({ photoId, thumbnailPath, watermarkedPath, width, height })
  );

  return matched.size;
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
