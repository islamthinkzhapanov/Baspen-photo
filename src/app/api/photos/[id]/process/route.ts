import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { s3, bucket } from "@/lib/storage/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getEventAccess } from "@/lib/event-auth";
import sharp from "sharp";
import { withHandler } from "@/lib/api-handler";

// POST /api/photos/[id]/process — generate thumbnail (Phase 1 simple version)
export const POST = withHandler(async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [photo] = await db
    .select()
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

  try {
    // Download original from S3
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: photo.storagePath,
    });
    const s3Object = await s3().send(getCommand);
    const bodyBytes = await s3Object.Body?.transformToByteArray();

    if (!bodyBytes) {
      throw new Error("Empty file");
    }

    const image = sharp(Buffer.from(bodyBytes));
    const metadata = await image.metadata();

    // Generate thumbnail (400px wide)
    const thumbnailBuffer = await image
      .resize(400, undefined, { fit: "inside" })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailKey = photo.storagePath.replace(
      "/originals/",
      "/thumbnails/"
    );

    await s3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: "image/jpeg",
      })
    );

    // Update photo record
    await db
      .update(photos)
      .set({
        thumbnailPath: `${process.env.S3_PUBLIC_URL}/${thumbnailKey}`,
        width: metadata.width,
        height: metadata.height,
        status: "ready",
      })
      .where(eq(photos.id, id));

    return NextResponse.json({ success: true, thumbnailKey });
  } catch {
    await db
      .update(photos)
      .set({ status: "failed" })
      .where(eq(photos.id, id));

    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
});
