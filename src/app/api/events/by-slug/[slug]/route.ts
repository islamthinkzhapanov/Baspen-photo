import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, photos, albums, users } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";

// GET /api/events/by-slug/[slug] — public event data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const isPreview = searchParams.get("preview") === "true";

  let event;

  if (isPreview) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const [found] = await db
      .select()
      .from(events)
      .where(and(eq(events.slug, slug), eq(events.ownerId, session.user.id)))
      .limit(1);
    event = found;
  } else {
    const [found] = await db
      .select()
      .from(events)
      .where(and(eq(events.slug, slug), eq(events.isPublished, true)))
      .limit(1);
    event = found;
  }

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

  // Fetch owner info
  const [owner] = await db
    .select({
      name: users.name,
      image: users.image,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, event.ownerId))
    .limit(1);

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      branding: event.branding,
      coverUrl: event.coverUrl,
      settings: event.settings,
      photoCount: event.photoCount,
      geofence: (event as Record<string, unknown>).geofence ?? null,
      owner: owner
        ? { name: owner.name, image: owner.image, phone: owner.phone }
        : null,
    },
    albums: eventAlbums,
    photos: eventPhotos,
  });
}
