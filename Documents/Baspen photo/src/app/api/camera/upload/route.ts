import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { validateApiKey } from "@/lib/api-key";
import { getUploadUrl } from "@/lib/storage/s3";
import { db } from "@/lib/db";
import { photos, events } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { enqueuePhotoProcessing } from "@/lib/queue/photo-queue";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

/**
 * POST /api/camera/upload
 *
 * Camera auto-upload endpoint for tethering software.
 * Auth: API key in Authorization header.
 *
 * Two modes:
 * 1. mode=presigned — returns a presigned URL for the client to upload to S3 directly
 * 2. mode=direct (default) — accepts multipart file upload, stores to S3, enqueues processing
 */
export async function POST(request: NextRequest) {
  const keyInfo = await validateApiKey(
    request.headers.get("authorization")
  );

  if (!keyInfo) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  const { userId, eventId } = keyInfo;

  // Verify event exists
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const mode = request.nextUrl.searchParams.get("mode");

  if (mode === "presigned") {
    return handlePresigned(request, eventId, userId);
  }

  return handleDirectUpload(request, eventId, userId);
}

/**
 * Mode: presigned — return presigned URLs for batch upload.
 */
async function handlePresigned(
  request: NextRequest,
  eventId: string,
  userId: string
) {
  const body = await request.json();
  const files = body.files as
    | { name: string; type: string; size: number }[]
    | undefined;

  if (!files?.length) {
    return NextResponse.json({ error: "No files specified" }, { status: 400 });
  }

  if (files.length > 100) {
    return NextResponse.json(
      { error: "Max 100 files per batch" },
      { status: 400 }
    );
  }

  const urls = await Promise.all(
    files.map(async (file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return { name: file.name, error: "Invalid type" };
      }
      if (file.size > MAX_SIZE) {
        return { name: file.name, error: "File too large" };
      }

      const ext = file.name.split(".").pop() || "jpg";
      const key = `events/${eventId}/originals/${nanoid()}.${ext}`;
      const uploadUrl = await getUploadUrl(key, file.type);

      return { name: file.name, key, uploadUrl, type: file.type };
    })
  );

  return NextResponse.json({ urls, eventId, userId });
}

/**
 * Mode: direct — accept a single multipart file, store to S3, enqueue.
 */
async function handleDirectUpload(
  request: NextRequest,
  eventId: string,
  userId: string
) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `events/${eventId}/originals/${nanoid()}.${ext}`;

  // Upload to S3 via presigned URL
  const uploadUrl = await getUploadUrl(key, file.type, 300);
  const arrayBuffer = await file.arrayBuffer();

  const s3Response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: arrayBuffer,
  });

  if (!s3Response.ok) {
    return NextResponse.json(
      { error: "Failed to upload to storage" },
      { status: 500 }
    );
  }

  // Create photo record
  const photoId = crypto.randomUUID();
  await db.insert(photos).values({
    id: photoId,
    eventId,
    uploadedBy: userId,
    storagePath: key,
    originalFilename: file.name,
    mimeType: file.type,
    fileSize: file.size,
    status: "processing",
  });

  // Increment event photo count
  await db
    .update(events)
    .set({ photoCount: sql`${events.photoCount} + 1` })
    .where(eq(events.id, eventId));

  // Enqueue for processing
  await enqueuePhotoProcessing({ photoId, eventId, storagePath: key });

  return NextResponse.json({
    photoId,
    storagePath: key,
    status: "processing",
  });
}

/**
 * GET /api/camera/upload?photoId=xxx
 *
 * Check processing status of a photo.
 */
export async function GET(request: NextRequest) {
  const keyInfo = await validateApiKey(
    request.headers.get("authorization")
  );

  if (!keyInfo) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  const photoId = request.nextUrl.searchParams.get("photoId");
  if (!photoId) {
    return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
  }

  const [photo] = await db
    .select({
      id: photos.id,
      status: photos.status,
      thumbnailPath: photos.thumbnailPath,
      bibNumbers: photos.bibNumbers,
      width: photos.width,
      height: photos.height,
    })
    .from(photos)
    .where(eq(photos.id, photoId))
    .limit(1);

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  return NextResponse.json(photo);
}
