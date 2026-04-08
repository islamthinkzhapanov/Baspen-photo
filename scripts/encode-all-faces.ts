/**
 * Encode face embeddings for ALL photos that don't have them yet.
 *
 * Run on the server:
 *   docker exec app-worker-1 npx tsx scripts/encode-all-faces.ts
 *
 * This script:
 * 1. Fetches all 'ready' photos that have NO face embeddings
 * 2. Downloads each original from S3
 * 3. Sends to /faces/detect endpoint
 * 4. Inserts new embeddings
 * 5. Rebuilds the HNSW index
 */

import postgres from "postgres";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const DATABASE_URL = process.env.DATABASE_URL!;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
const S3_ENDPOINT = process.env.S3_ENDPOINT!;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY!;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY!;
const S3_BUCKET = process.env.S3_BUCKET || "baspen-photos";
const S3_REGION = process.env.S3_REGION || "us-east-1";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;

const sql = postgres(DATABASE_URL);

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

interface FaceResult {
  box: {
    probability: number;
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  };
  embedding: number[];
}

async function detectFaces(imageBuffer: Buffer): Promise<FaceResult[]> {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }),
    "photo.jpg"
  );

  const response = await fetch(`${ML_SERVICE_URL}/faces/detect`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Face detection failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.result || [];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== Encoding face embeddings for all photos ===\n");

  // Check ML service health
  try {
    const healthResp = await fetch(`${ML_SERVICE_URL}/health`);
    const health = await healthResp.json();
    if (!health.face_model_loaded) {
      console.error("ERROR: ML service face model not loaded!");
      process.exit(1);
    }
    console.log("ML service is healthy, face model loaded.\n");
  } catch (err) {
    console.error(`ERROR: Cannot reach ML service at ${ML_SERVICE_URL}:`, err);
    process.exit(1);
  }

  // Get all ready photos WITHOUT face embeddings
  const photos = await sql`
    SELECT p.id, p.storage_path, p.event_id
    FROM photos p
    LEFT JOIN face_embeddings fe ON fe.photo_id = p.id
    WHERE p.status = 'ready'
      AND p.storage_path IS NOT NULL
      AND fe.id IS NULL
    ORDER BY p.created_at DESC
  `;

  console.log(`Found ${photos.length} photos without face embeddings.\n`);

  if (photos.length === 0) {
    console.log("All photos already have embeddings. Nothing to do.");
    await sql.end();
    return;
  }

  let processed = 0;
  let failed = 0;
  let noFaces = 0;
  let totalNewFaces = 0;

  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const batch = photos.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (photo) => {
        try {
          const getCmd = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: photo.storage_path,
          });
          const s3Object = await s3.send(getCmd);
          const bodyBytes = await s3Object.Body?.transformToByteArray();

          if (!bodyBytes) {
            console.warn(`  SKIP ${photo.id}: empty file in S3`);
            failed++;
            return;
          }

          const imageBuffer = Buffer.from(bodyBytes);
          const faces = await detectFaces(imageBuffer);

          if (faces.length === 0) {
            noFaces++;
            processed++;
            return;
          }

          for (const face of faces) {
            const embeddingStr = `[${face.embedding.join(",")}]`;
            const bboxJson = JSON.stringify({
              x: face.box.x_min,
              y: face.box.y_min,
              w: face.box.x_max - face.box.x_min,
              h: face.box.y_max - face.box.y_min,
            });

            await sql`
              INSERT INTO face_embeddings (id, photo_id, event_id, embedding, bbox, confidence, created_at)
              VALUES (
                gen_random_uuid(),
                ${photo.id},
                ${photo.event_id},
                ${embeddingStr}::vector(512),
                ${bboxJson}::jsonb,
                ${face.box.probability},
                NOW()
              )
            `;
          }

          totalNewFaces += faces.length;
          processed++;
        } catch (err) {
          console.error(`  FAIL ${photo.id}: ${err}`);
          failed++;
        }
      })
    );

    const done = Math.min(i + BATCH_SIZE, photos.length);
    console.log(
      `  Progress: ${done}/${photos.length} (${processed} ok, ${noFaces} no faces, ${failed} failed, ${totalNewFaces} embeddings)`
    );

    if (i + BATCH_SIZE < photos.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(
    `\nDone: ${processed} ok, ${noFaces} no faces, ${failed} failed, ${totalNewFaces} new face embeddings.\n`
  );

  // Rebuild HNSW index
  console.log("Rebuilding HNSW index...");
  await sql`DROP INDEX IF EXISTS face_embeddings_embedding_hnsw_idx`;
  await sql`
    CREATE INDEX face_embeddings_embedding_hnsw_idx
    ON face_embeddings USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
  `;
  console.log("  HNSW index rebuilt.\n");

  console.log("=== All done! ===");
  await sql.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
