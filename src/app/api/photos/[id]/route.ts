import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { photos, events, faceEmbeddings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getDownloadUrl, getPublicUrl, deleteObject } from "@/lib/storage/s3";
import { getEventAccess } from "@/lib/event-auth";
import { withHandler } from "@/lib/api-handler";

// GET /api/photos/[id] — get photo details (public)
export const GET = withHandler(async function GET(
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
});

// DELETE /api/photos/[id] — delete photo (uploader or event owner)
export const DELETE = withHandler(async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [photo] = await db
    .select({
      id: photos.id,
      eventId: photos.eventId,
      uploadedBy: photos.uploadedBy,
      storagePath: photos.storagePath,
      thumbnailPath: photos.thumbnailPath,
      watermarkedPath: photos.watermarkedPath,
    })
    .from(photos)
    .where(eq(photos.id, id))
    .limit(1);

  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = await getEventAccess(photo.eventId, session.user.id);
  if (!access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only uploader or event owner can delete
  const isUploader = photo.uploadedBy === session.user.id;
  const isOwner = access.role === "owner";
  if (!isUploader && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete DB records in a transaction
  await db.transaction(async (tx) => {
    await tx.delete(faceEmbeddings).where(eq(faceEmbeddings.photoId, id));
    await tx.delete(photos).where(eq(photos.id, id));
    await tx
      .update(events)
      .set({
        photoCount: sql`greatest(${events.photoCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(events.id, photo.eventId));
  });

  // Delete files from S3 after DB transaction succeeds
  const keysToDelete = [
    photo.storagePath,
    photo.thumbnailPath,
    photo.watermarkedPath,
  ].filter(Boolean) as string[];

  await Promise.allSettled(keysToDelete.map((key) => deleteObject(key)));

  return NextResponse.json({ success: true });
});
