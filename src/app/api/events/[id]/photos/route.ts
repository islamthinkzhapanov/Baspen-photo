import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { photos, events } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { enqueuePhotoProcessing } from "@/lib/queue/photo-queue";
import { getEventAccess } from "@/lib/event-auth";

// GET /api/events/[id]/photos — list photos for event
export async function GET(
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

  const eventPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.eventId, id))
    .orderBy(desc(photos.createdAt));

  return NextResponse.json(eventPhotos);
}

// POST /api/events/[id]/photos — register uploaded photo (after S3 upload)
export async function POST(
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
  } = body as {
    storagePath: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
  };

  if (!storagePath) {
    return NextResponse.json({ error: "Missing storagePath" }, { status: 400 });
  }

  const [photo] = await db
    .insert(photos)
    .values({
      eventId: id,
      uploadedBy: session.user.id,
      storagePath,
      originalFilename,
      mimeType,
      fileSize,
      status: "processing",
    })
    .returning();

  // Increment event photo count
  await db
    .update(events)
    .set({
      photoCount: sql`${events.photoCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));

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
}
