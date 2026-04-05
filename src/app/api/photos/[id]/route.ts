import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, events, faceEmbeddings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getDownloadUrl, getPublicUrl } from "@/lib/storage/s3";

// GET /api/photos/[id] — get photo details (public)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [photo] = await db
    .select({
      id: photos.id,
      eventId: photos.eventId,
      thumbnailPath: photos.thumbnailPath,
      watermarkedPath: photos.watermarkedPath,
      storagePath: photos.storagePath,
      originalFilename: photos.originalFilename,
      width: photos.width,
      height: photos.height,
      exifData: photos.exifData,
      createdAt: photos.createdAt,
      status: photos.status,
    })
    .from(photos)
    .where(eq(photos.id, id))
    .limit(1);

  if (!photo || photo.status !== "ready") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get event info for context
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      settings: events.settings,
      branding: events.branding,
    })
    .from(events)
    .where(eq(events.id, photo.eventId))
    .limit(1);

  // Count faces in this photo
  const [faceCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(faceEmbeddings)
    .where(eq(faceEmbeddings.photoId, id));

  const isFreeDownload = event?.settings?.freeDownload === true;

  return NextResponse.json({
    photo: {
      ...photo,
      facesCount: faceCount?.count || 0,
    },
    event: event
      ? {
          id: event.id,
          title: event.title,
          slug: event.slug,
          branding: event.branding,
        }
      : null,
    freeDownload: isFreeDownload,
  });
}
