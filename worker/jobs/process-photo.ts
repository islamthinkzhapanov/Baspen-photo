import { Job } from "bullmq";
import sharp from "sharp";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { detectFaces } from "../../src/lib/face-detection/client";
import {
  generateWatermarkedImage,
  type WatermarkConfig,
} from "../../src/lib/watermark";
import {
  detectBibNumbers,
  bibDetectorHealthCheck,
} from "../../src/lib/bib-detector/client";
import type { PhotoJobData } from "../../src/lib/queue/photo-queue";
import {
  matchParticipants,
  publishPhotoReady,
} from "./match-participants";

// Direct DB & S3 connections (worker runs as separate process)
const dbClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(dbClient);

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const bucket = process.env.S3_BUCKET || "baspen-photos";

/**
 * Process a photo:
 * 1. Download original from S3
 * 2. Extract metadata (width, height, EXIF)
 * 3. Generate thumbnail (400px)
 * 4. Generate watermarked version (using event settings)
 * 5. Detect faces via CompreFace → store embeddings in pgvector
 * 6. Update photo status to "ready"
 */
export async function processPhoto(job: Job<PhotoJobData>) {
  const { photoId, eventId, storagePath } = job.data;

  job.updateProgress(5);

  // Fetch event settings for watermark config
  const [eventRow] = await db.execute(
    sql`SELECT settings FROM events WHERE id = ${eventId}`
  );
  const settings = (eventRow as { settings: Record<string, unknown> } | undefined)?.settings;
  const watermarkConfig: WatermarkConfig = {
    enabled: (settings?.watermarkEnabled as boolean) !== false,
    text: (settings?.watermarkText as string) || undefined,
    opacity: (settings?.watermarkOpacity as number) || undefined,
  };

  // 1. Download original from S3
  const getCmd = new GetObjectCommand({ Bucket: bucket, Key: storagePath });
  const s3Object = await s3.send(getCmd);
  const bodyBytes = await s3Object.Body?.transformToByteArray();

  if (!bodyBytes) {
    throw new Error("Empty file from S3");
  }

  const imageBuffer = Buffer.from(bodyBytes);
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  job.updateProgress(20);

  // 2. Generate thumbnails (JPEG + WebP for performance)
  const thumbnailJpeg = await sharp(imageBuffer)
    .resize(400, undefined, { fit: "inside" })
    .jpeg({ quality: 80 })
    .toBuffer();

  const thumbnailWebp = await sharp(imageBuffer)
    .resize(400, undefined, { fit: "inside" })
    .webp({ quality: 75 })
    .toBuffer();

  const thumbnailAvif = await sharp(imageBuffer)
    .resize(400, undefined, { fit: "inside" })
    .avif({ quality: 65, effort: 4 })
    .toBuffer();

  // Generate tiny blurred placeholder for blur-up effect (~ 300-500 bytes)
  const placeholderBuffer = await sharp(imageBuffer)
    .resize(20, undefined, { fit: "inside" })
    .blur(2)
    .jpeg({ quality: 40 })
    .toBuffer();
  const placeholder = `data:image/jpeg;base64,${placeholderBuffer.toString("base64")}`;

  const thumbnailKey = storagePath.replace("/originals/", "/thumbnails/");
  const thumbnailWebpKey = thumbnailKey.replace(/\.\w+$/, ".webp");
  const thumbnailAvifKey = thumbnailKey.replace(/\.\w+$/, ".avif");

  await Promise.all([
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbnailKey,
        Body: thumbnailJpeg,
        ContentType: "image/jpeg",
      })
    ),
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbnailWebpKey,
        Body: thumbnailWebp,
        ContentType: "image/webp",
      })
    ),
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbnailAvifKey,
        Body: thumbnailAvif,
        ContentType: "image/avif",
      })
    ),
  ]);

  job.updateProgress(40);

  // 3. Generate watermarked version
  const watermarkedBuffer = await generateWatermarkedImage(
    imageBuffer,
    watermarkConfig
  );
  const watermarkedKey = storagePath.replace("/originals/", "/watermarked/");

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: watermarkedKey,
      Body: watermarkedBuffer,
      ContentType: "image/jpeg",
    })
  );

  job.updateProgress(60);

  // 4. Detect faces via ML service and store embeddings
  // If ML service fails, re-throw so BullMQ retries the job (3 attempts configured).
  // This ensures every photo gets face embeddings — users expect face search to work.
  let facesDetected = 0;
  const faces = await detectFaces(imageBuffer);
  facesDetected = faces.length;

  for (const face of faces) {
    const embeddingStr = `[${face.embedding.join(",")}]`;
    const bboxJson = JSON.stringify({
      x: face.box.x_min,
      y: face.box.y_min,
      w: face.box.x_max - face.box.x_min,
      h: face.box.y_max - face.box.y_min,
    });

    await db.execute(sql`
      INSERT INTO face_embeddings (id, photo_id, event_id, embedding, bbox, confidence, created_at)
      VALUES (
        gen_random_uuid(),
        ${photoId},
        ${eventId},
        ${embeddingStr}::vector(512),
        ${bboxJson}::jsonb,
        ${face.box.probability},
        NOW()
      )
    `);
  }

  // 4.5. Detect bib/race numbers via bib-detector microservice
  let detectedBibNumbers: string[] = [];
  try {
    const bibHealthy = await bibDetectorHealthCheck();
    if (bibHealthy) {
      const bibResult = await detectBibNumbers(imageBuffer);
      detectedBibNumbers = bibResult.bib_numbers.map((b) => b.number);
      if (detectedBibNumbers.length > 0) {
        console.log(
          `[process-photo] Bib numbers detected for ${photoId}: ${detectedBibNumbers.join(", ")}`
        );
      }
    }
  } catch (err) {
    // Bib detection failure is non-fatal
    console.error(
      `[process-photo] Bib detection failed for ${photoId}:`,
      err
    );
  }

  job.updateProgress(90);

  // 5. Extract EXIF data
  const exifData = metadata.exif ? extractBasicExif(metadata) : null;

  // 6. Update photo record → status "ready"
  const publicUrl =
    process.env.S3_PUBLIC_URL || `http://localhost:9000/${bucket}`;
  await db.execute(sql`
    UPDATE photos SET
      thumbnail_path = ${`${publicUrl}/${thumbnailKey}`},
      thumbnail_avif_path = ${`${publicUrl}/${thumbnailAvifKey}`},
      watermarked_path = ${`${publicUrl}/${watermarkedKey}`},
      placeholder = ${placeholder},
      width = ${metadata.width || null},
      height = ${metadata.height || null},
      exif_data = ${exifData ? JSON.stringify(exifData) : null}::jsonb,
      bib_numbers = ${detectedBibNumbers.length > 0 ? detectedBibNumbers : sql`bib_numbers`},
      status = 'ready'
    WHERE id = ${photoId}
  `);

  // 7. Match against active participants + publish realtime notifications
  const thumbUrl = `${publicUrl}/${thumbnailKey}`;
  const watermarkUrl = `${publicUrl}/${watermarkedKey}`;
  let matchCount = 0;

  if (facesDetected > 0) {
    try {
      matchCount = await matchParticipants(
        photoId,
        eventId,
        thumbUrl,
        watermarkUrl,
        metadata.width ?? null,
        metadata.height ?? null
      );
    } catch (err) {
      console.error(`[process-photo] Participant matching failed:`, err);
    }
  } else {
    // Even without faces, notify that a new photo is ready
    await publishPhotoReady(
      eventId,
      photoId,
      thumbUrl,
      watermarkUrl,
      metadata.width ?? null,
      metadata.height ?? null
    );
  }

  job.updateProgress(100);

  return {
    photoId,
    thumbnailKey,
    watermarkedKey,
    facesDetected,
    matchCount,
    bibNumbers: detectedBibNumbers,
    width: metadata.width,
    height: metadata.height,
  };
}

function extractBasicExif(
  metadata: sharp.Metadata
): Record<string, unknown> | null {
  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    space: metadata.space,
    channels: metadata.channels,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
  };
}
