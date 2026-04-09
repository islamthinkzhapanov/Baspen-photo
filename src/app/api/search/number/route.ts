import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, events } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * GET /api/search/number?eventId=xxx&number=1234
 *
 * Search for photos by bib/race number.
 * Photos store bib_numbers as text[] — we search with ANY().
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const number = searchParams.get("number");

  if (!eventId || !number) {
    return NextResponse.json(
      { error: "Missing eventId or number" },
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

  // Search photos where bib_numbers array contains the given number
  const matchedPhotos = await db
    .select({
      id: photos.id,
      thumbnailPath: photos.thumbnailPath,
      thumbnailAvifPath: photos.thumbnailAvifPath,
      watermarkedPath: photos.watermarkedPath,
      placeholder: photos.placeholder,
      width: photos.width,
      height: photos.height,
      createdAt: photos.createdAt,
      albumId: photos.albumId,
    })
    .from(photos)
    .where(
      and(
        eq(photos.eventId, eventId),
        eq(photos.status, "ready"),
        sql`${number} = ANY(${photos.bibNumbers})`
      )
    )
    .orderBy(desc(photos.createdAt))
    .limit(200);

  return NextResponse.json({
    photos: matchedPhotos,
    total: matchedPhotos.length,
  });
}
