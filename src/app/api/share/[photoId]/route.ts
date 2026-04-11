import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, events, sponsorBlocks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { generateShareFrame } from "@/lib/share-frame";
import { s3, s3Public, bucket } from "@/lib/storage/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { withHandler } from "@/lib/api-handler";

/**
 * GET /api/share/[photoId] — Generate branded share image.
 *
 * Returns a presigned URL to the generated share image.
 * Caches the result in S3 for repeated access.
 */
export const GET = withHandler(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;

  // Get photo + event data
  const [photo] = await db
    .select({
      id: photos.id,
      eventId: photos.eventId,
      storagePath: photos.storagePath,
      watermarkedPath: photos.watermarkedPath,
    })
    .from(photos)
    .where(eq(photos.id, photoId))
    .limit(1);

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const [event] = await db
    .select({
      title: events.title,
      date: events.date,
      branding: events.branding,
    })
    .from(events)
    .where(eq(events.id, photo.eventId))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Check if share image already cached
  const shareKey = photo.storagePath.replace("/originals/", "/share/");
  try {
    // If the object exists, return it
    const headRes = await s3().send(
      new GetObjectCommand({ Bucket: bucket, Key: shareKey })
    );
    if (headRes.Body) {
      const url = await getSignedUrl(
        s3Public(),
        new GetObjectCommand({ Bucket: bucket, Key: shareKey }),
        { expiresIn: 3600 }
      );
      return NextResponse.json({ url, cached: true });
    }
  } catch {
    // Object doesn't exist yet, generate it
  }

  // Fetch sponsors for this event
  const sponsors = await db
    .select({ name: sponsorBlocks.name, logoUrl: sponsorBlocks.logoUrl })
    .from(sponsorBlocks)
    .where(eq(sponsorBlocks.eventId, photo.eventId))
    .orderBy(asc(sponsorBlocks.sortOrder));

  // Download the watermarked image (or original if no watermark)
  const imageKey = photo.watermarkedPath
    ? extractKeyFromUrl(photo.watermarkedPath)
    : photo.storagePath;

  const s3Obj = await s3().send(
    new GetObjectCommand({ Bucket: bucket, Key: imageKey })
  );
  const bodyBytes = await s3Obj.Body?.transformToByteArray();
  if (!bodyBytes) {
    return NextResponse.json(
      { error: "Failed to read image" },
      { status: 500 }
    );
  }

  const imageBuffer = Buffer.from(bodyBytes);

  // Generate share frame
  const shareBuffer = await generateShareFrame(imageBuffer, {
    eventTitle: event.title,
    eventDate: event.date
      ? new Date(event.date).toLocaleDateString()
      : undefined,
    eventLogo: event.branding?.logo,
    sponsors: sponsors.map((s) => ({ name: s.name, logoUrl: s.logoUrl })),
    borderColor: event.branding?.primaryColor || "#005FF9",
  });

  // Upload to S3
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: shareKey,
      Body: shareBuffer,
      ContentType: "image/jpeg",
    })
  );

  const url = await getSignedUrl(
    s3Public(),
    new GetObjectCommand({ Bucket: bucket, Key: shareKey }),
    { expiresIn: 3600 }
  );

  return NextResponse.json({ url, cached: false });
});

function extractKeyFromUrl(fullUrl: string): string {
  // URL format: http://host:port/bucket/key → extract key after bucket
  const bucketStr = process.env.S3_BUCKET || "baspen-photos";
  const idx = fullUrl.indexOf(bucketStr);
  if (idx !== -1) {
    return fullUrl.substring(idx + bucketStr.length + 1);
  }
  // Fallback: try extracting path after last //host/
  return fullUrl.split("/").slice(4).join("/");
}
