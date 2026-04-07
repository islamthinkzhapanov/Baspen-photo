import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { photos, events, faceEmbeddings } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { deleteObject } from "@/lib/storage/s3";
import { getEventAccess } from "@/lib/event-auth";

// DELETE /api/events/[id]/photos/bulk-delete
// Body: { photoIds: string[] } or { all: true }
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getEventAccess(eventId, session.user.id);
  if (!access.hasAccess || access.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { photoIds, all } = body as { photoIds?: string[]; all?: boolean };

  if (!all && (!photoIds || photoIds.length === 0)) {
    return NextResponse.json({ error: "No photos specified" }, { status: 400 });
  }

  // Fetch target photos
  const condition = all
    ? eq(photos.eventId, eventId)
    : and(eq(photos.eventId, eventId), inArray(photos.id, photoIds!));

  const targetPhotos = await db
    .select({
      id: photos.id,
      storagePath: photos.storagePath,
      thumbnailPath: photos.thumbnailPath,
      watermarkedPath: photos.watermarkedPath,
    })
    .from(photos)
    .where(condition);

  if (targetPhotos.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const targetIds = targetPhotos.map((p) => p.id);

  // Delete S3 objects in parallel (non-blocking)
  const s3Keys = targetPhotos.flatMap((p) =>
    [p.storagePath, p.thumbnailPath, p.watermarkedPath].filter(Boolean) as string[]
  );
  // Fire-and-forget S3 deletion in batches of 20
  const BATCH = 20;
  for (let i = 0; i < s3Keys.length; i += BATCH) {
    await Promise.allSettled(
      s3Keys.slice(i, i + BATCH).map((key) => deleteObject(key))
    );
  }

  // Delete face embeddings
  await db.delete(faceEmbeddings).where(inArray(faceEmbeddings.photoId, targetIds));

  // Delete photo records
  await db.delete(photos).where(inArray(photos.id, targetIds));

  // Update event photo count
  await db
    .update(events)
    .set({
      photoCount: sql`greatest(${events.photoCount} - ${targetPhotos.length}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));

  return NextResponse.json({ deleted: targetPhotos.length });
}
