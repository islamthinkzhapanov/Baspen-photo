import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

/**
 * GET /api/search/session — Return cached matches for a participant session.
 *
 * Query params:
 * - eventId: event UUID
 * - sessionToken: participant session token
 *
 * Returns previously matched photos without re-running face search.
 */
export const GET = withHandler(async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  const sessionToken = request.nextUrl.searchParams.get("sessionToken");

  if (!eventId || !sessionToken) {
    return NextResponse.json(
      { error: "Missing eventId or sessionToken" },
      { status: 400 }
    );
  }

  // Find participant by session token + event
  const matchedPhotos = await db.execute(sql`
    SELECT
      p.id,
      p.thumbnail_path,
      p.watermarked_path,
      p.width,
      p.height,
      p.created_at,
      p.album_id,
      pm.similarity
    FROM participant_matches pm
    JOIN participants pt ON pt.id = pm.participant_id
    JOIN photos p ON p.id = pm.photo_id
    WHERE pt.session_token = ${sessionToken}
      AND pt.event_id = ${eventId}
      AND p.status = 'ready'
    ORDER BY pm.similarity DESC
    LIMIT 200
  `);

  // Update last_search_at
  await db.execute(sql`
    UPDATE participants
    SET last_search_at = NOW()
    WHERE session_token = ${sessionToken} AND event_id = ${eventId}
  `);

  return NextResponse.json({
    photos: matchedPhotos,
    sessionToken,
    total: (matchedPhotos as unknown[]).length,
  });
});
