import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, events, participants } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { detectFaces } from "@/lib/face-detection/client";
import { nanoid } from "nanoid";

const SIMILARITY_THRESHOLD = 0.25;
const MAX_RESULTS = 200;

/**
 * POST /api/search/face — search for photos by face (selfie)
 *
 * Accepts multipart/form-data with:
 * - file: selfie image
 * - eventId: event UUID
 * - sessionToken: optional existing session
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

  // Detect face in selfie via CompreFace
  const imageBuffer = Buffer.from(await file.arrayBuffer());
  const faces = await detectFaces(imageBuffer);

  if (faces.length === 0) {
    return NextResponse.json(
      { error: "no_face_detected", photos: [] },
      { status: 200 }
    );
  }

  // Use first detected face embedding for search
  const queryEmbedding = faces[0].embedding;
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // DEBUG: log top-10 similarity scores (no threshold filter) to see real distribution
  const debugTop = await db.execute(sql`
    SELECT DISTINCT ON (p.id)
      p.id,
      p.original_filename,
      1 - (fe.embedding <=> ${embeddingStr}::vector(512)) AS similarity
    FROM face_embeddings fe
    JOIN photos p ON p.id = fe.photo_id
    WHERE fe.event_id = ${eventId} AND p.status = 'ready'
    ORDER BY p.id, similarity DESC
  `);
  const debugSorted = (debugTop as Array<Record<string, unknown>>)
    .sort((a, b) => (b.similarity as number) - (a.similarity as number))
    .slice(0, 20);
  console.log(`[face-search] TOP-20 scores (no threshold):`,
    debugSorted.map((r) => `${(r.similarity as number).toFixed(3)} ${r.original_filename}`).join(" | ")
  );

  // pgvector cosine similarity search
  // cosine_distance returns 0..2, similarity = 1 - distance
  const matchedPhotos = await db.execute(sql`
    SELECT DISTINCT ON (p.id)
      p.id,
      p.thumbnail_path,
      p.thumbnail_avif_path,
      p.watermarked_path,
      p.placeholder,
      p.width,
      p.height,
      p.created_at,
      1 - (fe.embedding <=> ${embeddingStr}::vector(512)) AS similarity
    FROM face_embeddings fe
    JOIN photos p ON p.id = fe.photo_id
    WHERE fe.event_id = ${eventId}
      AND p.status = 'ready'
      AND 1 - (fe.embedding <=> ${embeddingStr}::vector(512)) > ${SIMILARITY_THRESHOLD}
    ORDER BY p.id, similarity DESC
    LIMIT ${MAX_RESULTS}
  `);

  // Sort by similarity descending
  const sortedPhotos = (matchedPhotos as Array<Record<string, unknown>>)
    .sort((a, b) => (b.similarity as number) - (a.similarity as number));

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

    // Store selfie embedding via raw SQL
    await db.execute(sql`
      UPDATE participants
      SET selfie_embedding = ${embeddingStr}::vector(512)
      WHERE id = ${participant.id}
    `);

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
