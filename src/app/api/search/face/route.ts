import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, events, participants } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  searchFacesByImage,
  indexFaces,
  getCollectionId,
  deleteFaces,
} from "@/lib/rekognition/client";
import { nanoid } from "nanoid";

const MAX_RESULTS = 200;

/**
 * POST /api/search/face — search for photos by face (selfie)
 *
 * Accepts multipart/form-data with:
 * - file: selfie image
 * - eventId: event UUID
 * - sessionToken: optional existing session
 *
 * Uses AWS Rekognition:
 * 1. searchFacesByImage to find matching photo faces
 * 2. indexFaces to store the selfie in the collection for future match-participants
 *
 * Returns matched photos sorted by similarity.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const eventId = formData.get("eventId") as string;

  if (!file || !eventId) {
    return NextResponse.json(
      { error: "Missing file or eventId" },
      { status: 400 }
    );
  }

  // Verify event exists and is published
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.isPublished, true)))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const imageBuffer = Buffer.from(await file.arrayBuffer());
  const collectionId = getCollectionId(eventId);

  // Search the collection for faces matching the selfie
  let faceMatches;
  try {
    faceMatches = await searchFacesByImage(
      collectionId,
      imageBuffer,
      MAX_RESULTS
    );
  } catch (err: unknown) {
    // Rekognition throws if no face detected in the image
    if (
      err instanceof Error &&
      err.message.includes("no faces in the image")
    ) {
      return NextResponse.json(
        { error: "no_face_detected", photos: [] },
        { status: 200 }
      );
    }
    throw err;
  }

  // Filter to only photo faces (not other selfies)
  const photoMatches = faceMatches.filter((m) =>
    m.externalImageId.startsWith("photo-")
  );

  // Extract photoIds from externalImageId ("photo-{uuid}")
  const photoIdSet = new Map<string, number>();
  for (const match of photoMatches) {
    const photoId = match.externalImageId.replace("photo-", "");
    const existing = photoIdSet.get(photoId);
    // Keep highest similarity per photo
    if (!existing || match.similarity > existing) {
      photoIdSet.set(photoId, match.similarity);
    }
  }

  // Fetch photo details for matched photos
  let sortedPhotos: Record<string, unknown>[] = [];
  if (photoIdSet.size > 0) {
    const photoIds = Array.from(photoIdSet.keys());
    const placeholders = photoIds.map((id) => sql`${id}::uuid`);

    const matchedPhotos = await db.execute(sql`
      SELECT
        p.id,
        p.thumbnail_path,
        p.thumbnail_avif_path,
        p.watermarked_path,
        p.placeholder,
        p.width,
        p.height,
        p.created_at,
        p.album_id
      FROM photos p
      WHERE p.id IN (${sql.join(placeholders, sql`, `)})
        AND p.status = 'ready'
    `);

    sortedPhotos = (matchedPhotos as unknown as Record<string, unknown>[]).map(
      (p) => ({
        ...p,
        similarity: photoIdSet.get(p.id as string) ?? 0,
      })
    );
    sortedPhotos.sort(
      (a, b) => (b.similarity as number) - (a.similarity as number)
    );
  }

  // Create or update participant session
  let sessionToken = formData.get("sessionToken") as string | null;
  if (!sessionToken) {
    sessionToken = nanoid(32);
  }

  try {
    // Upsert participant
    const [participant] = await db
      .insert(participants)
      .values({
        eventId,
        sessionToken,
        lastSearchAt: new Date(),
      })
      .onConflictDoUpdate({
        target: participants.sessionToken,
        set: { lastSearchAt: new Date() },
      })
      .returning();

    // Index the selfie into the collection so match-participants can find it later.
    // If participant already has a face indexed, delete old one first.
    if (participant.rekognitionFaceId) {
      try {
        await deleteFaces(collectionId, [participant.rekognitionFaceId]);
      } catch {
        // Old face may not exist — ignore
      }
    }

    const indexedFaces = await indexFaces(
      collectionId,
      imageBuffer,
      `selfie-${participant.id}`
    );

    if (indexedFaces.length > 0) {
      // Store the largest face's Rekognition ID on the participant
      const selfieFaceId = indexedFaces[0].faceId;
      await db.execute(sql`
        UPDATE participants
        SET rekognition_face_id = ${selfieFaceId}
        WHERE id = ${participant.id}
      `);
    }

    // Cache matches
    if (sortedPhotos.length > 0) {
      const values = sortedPhotos.map(
        (p) =>
          sql`(gen_random_uuid(), ${participant.id}, ${p.id as string}, ${p.similarity as number}, NOW())`
      );

      await db.execute(sql`
        INSERT INTO participant_matches (id, participant_id, photo_id, similarity, created_at)
        VALUES ${sql.join(values, sql`, `)}
        ON CONFLICT (participant_id, photo_id) DO UPDATE SET similarity = EXCLUDED.similarity
      `);
    }
  } catch (err) {
    // Session tracking failure is non-fatal
    console.error("Failed to save participant session:", err);
  }

  return NextResponse.json({
    photos: sortedPhotos,
    sessionToken,
    total: sortedPhotos.length,
  });
}
