import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, events } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { s3, bucket } from "@/lib/storage/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import JSZip from "jszip";

// POST /api/photos/download-zip — generate a zip with requested photo IDs
export async function POST(request: NextRequest) {
  const body = await request.json();
  const photoIds: string[] = body.ids;

  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return NextResponse.json({ error: "No photo IDs" }, { status: 400 });
  }

  // Cap at 500 photos to avoid memory issues
  const ids = photoIds.slice(0, 500);

  const rows = await db
    .select({
      id: photos.id,
      eventId: photos.eventId,
      storagePath: photos.storagePath,
      watermarkedPath: photos.watermarkedPath,
      originalFilename: photos.originalFilename,
    })
    .from(photos)
    .where(and(inArray(photos.id, ids), eq(photos.status, "ready")));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No photos found" }, { status: 404 });
  }

  // Check if event allows free download
  const eventId = rows[0].eventId;
  const [event] = await db
    .select({ settings: events.settings })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  const isFree = event?.settings?.freeDownload === true;

  const zip = new JSZip();

  await Promise.all(
    rows.map(async (photo, i) => {
      const key = isFree
        ? photo.storagePath
        : photo.watermarkedPath || photo.storagePath.replace("/originals/", "/watermarked/");

      try {
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const response = await s3.send(command);
        const bytes = await response.Body?.transformToByteArray();
        if (bytes) {
          const filename = photo.originalFilename || `photo_${i + 1}.jpg`;
          zip.file(filename, bytes);
        }
      } catch {
        // Skip failed downloads
      }
    })
  );

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="photos.zip"`,
    },
  });
}
