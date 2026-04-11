import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { photos, events } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { enqueuePhotoProcessing } from "@/lib/queue/photo-queue";
import { getEventAccess } from "@/lib/event-auth";
import { getDownloadUrl, getPublicUrl } from "@/lib/storage/s3";
import { withHandler } from "@/lib/api-handler";

// GET /api/events/[id]/photos — list photos for event
export const GET = withHandler(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getEventAccess(id, session.user.id);
  if (!access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.min(500, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 100));

  const [eventPhotos, countResult] = await Promise.all([
    db
      .select()
      .from(photos)
      .where(eq(photos.eventId, id))
      .orderBy(desc(photos.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)` })
      .from(photos)
      .where(eq(photos.eventId, id)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  // Generate presigned URLs for photos without thumbnails
  const photosWithUrls = await Promise.all(
    eventPhotos.map(async (photo) => {
      const publicPath = getPublicUrl(photo.storagePath);
      if (photo.thumbnailPath || photo.watermarkedPath) {
        return { ...photo, publicPath };
      }
      // Fallback: generate presigned URL from original
      try {
        const previewUrl = await getDownloadUrl(photo.storagePath, 3600);
        return { ...photo, thumbnailPath: previewUrl, publicPath };
      } catch {
        return { ...photo, publicPath };
      }
    })
  );

  return NextResponse.json({ photos: photosWithUrls, total, page, limit });
});

// POST /api/events/[id]/photos — register uploaded photo (after S3 upload)
export const POST = withHandler(async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Any event member can upload photos
  const access = await getEventAccess(id, session.user.id);
  if (!access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    storagePath,
    originalFilename,
    mimeType,
    fileSize,
    albumId,
  } = body as {
    storagePath: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    albumId?: string;
  };

  if (!storagePath) {
    return NextResponse.json({ error: "Missing storagePath" }, { status: 400 });
  }

  // Validate storagePath belongs to this event
  const pathRegex = new RegExp(`^events/${id}/originals/[a-zA-Z0-9_-]+\\.[a-z]+$`);
  if (!pathRegex.test(storagePath)) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  }

  // Validate mimeType
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!allowedTypes.includes(mimeType)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const [photo] = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(photos)
      .values({
        eventId: id,
        uploadedBy: session.user.id,
        storagePath,
        originalFilename,
        mimeType,
        fileSize,
        status: "processing",
        ...(albumId ? { albumId } : {}),
      })
      .returning();

    await tx
      .update(events)
      .set({
        photoCount: sql`${events.photoCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id));

    return [inserted];
  });

  // Enqueue BullMQ job for thumbnail + watermark + face detection
  try {
    await enqueuePhotoProcessing({
      photoId: photo.id,
      eventId: id,
      storagePath,
    });
  } catch (err) {
    console.error("Failed to enqueue photo processing:", err);
    // Non-fatal: photo is saved, processing can be retried
  }

  return NextResponse.json(photo, { status: 201 });
});
