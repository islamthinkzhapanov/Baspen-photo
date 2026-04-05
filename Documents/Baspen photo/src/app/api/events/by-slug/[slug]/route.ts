import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, photos, albums } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";

// GET /api/events/by-slug/[slug] — public event data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isPublished, true)))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch albums for this event
  const eventAlbums = await db
    .select({
      id: albums.id,
      name: albums.name,
      sortOrder: albums.sortOrder,
    })
    .from(albums)
    .where(eq(albums.eventId, event.id))
    .orderBy(asc(albums.sortOrder));

  const eventPhotos = await db
    .select({
      id: photos.id,
      albumId: photos.albumId,
      thumbnailPath: photos.thumbnailPath,
      watermarkedPath: photos.watermarkedPath,
      width: photos.width,
      height: photos.height,
      createdAt: photos.createdAt,
    })
    .from(photos)
    .where(and(eq(photos.eventId, event.id), eq(photos.status, "ready")))
    .orderBy(desc(photos.createdAt));

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      branding: event.branding,
      settings: event.settings,
      photoCount: event.photoCount,
      geofence: (event as Record<string, unknown>).geofence ?? null,
    },
    albums: eventAlbums,
    photos: eventPhotos,
  });
}
