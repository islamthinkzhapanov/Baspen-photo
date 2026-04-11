import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { photos, events } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { s3, bucket } from "@/lib/storage/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import yazl from "yazl";
import { Readable } from "stream";
import { withHandler } from "@/lib/api-handler";

// POST /api/photos/download-zip — stream a zip with requested photo IDs
export const POST = withHandler(async function POST(request: NextRequest) {
  const body = await request.json();
  const photoIds: string[] = body.ids;

  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return new Response(JSON.stringify({ error: "No photo IDs" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Query in batches of 500 (Postgres parameter limit)
  const allRows: {
    id: string;
    eventId: string;
    storagePath: string;
    watermarkedPath: string | null;
    originalFilename: string | null;
  }[] = [];

  for (let i = 0; i < photoIds.length; i += 500) {
    const batch = photoIds.slice(i, i + 500);
    const rows = await db
      .select({
        id: photos.id,
        eventId: photos.eventId,
        storagePath: photos.storagePath,
        watermarkedPath: photos.watermarkedPath,
        originalFilename: photos.originalFilename,
      })
      .from(photos)
      .where(and(inArray(photos.id, batch), eq(photos.status, "ready")));
    allRows.push(...rows);
  }

  if (allRows.length === 0) {
    return new Response(JSON.stringify({ error: "No photos found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if event allows free download
  const eventId = allRows[0].eventId;
  const [event] = await db
    .select({ settings: events.settings })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  const isFree = event?.settings?.freeDownload === true;

  // Track filenames to avoid duplicates
  const usedNames = new Map<string, number>();

  function uniqueName(name: string): string {
    const count = usedNames.get(name) || 0;
    usedNames.set(name, count + 1);
    if (count === 0) return name;
    const dot = name.lastIndexOf(".");
    if (dot === -1) return `${name}_${count}`;
    return `${name.slice(0, dot)}_${count}${name.slice(dot)}`;
  }

  // Use yazl for memory-efficient streaming zip
  // compress: false for JPEGs — they're already compressed, saves CPU
  const zipfile = new yazl.ZipFile();

  // Process photos sequentially to keep memory flat
  (async () => {
    for (let i = 0; i < allRows.length; i++) {
      const photo = allRows[i];
      const key = isFree
        ? photo.storagePath
        : photo.watermarkedPath ||
          photo.storagePath.replace("/originals/", "/watermarked/");

      try {
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const response = await s3().send(command);
        const s3Stream = response.Body as Readable;

        if (s3Stream) {
          const baseName = photo.originalFilename || `photo_${i + 1}.jpg`;
          const filename = uniqueName(baseName);

          // compress: false — JPEGs are already compressed
          zipfile.addReadStream(s3Stream, filename, { compress: false });

          // Wait for this entry to be fully read before adding next
          // This keeps memory flat regardless of photo count
          await new Promise<void>((resolve, reject) => {
            s3Stream.on("end", resolve);
            s3Stream.on("error", reject);
          });
        }
      } catch {
        // Skip failed downloads
      }
    }
    zipfile.end();
  })();

  // Convert Node readable stream to Web ReadableStream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webStream = Readable.toWeb(zipfile.outputStream as any) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="photos.zip"`,
      "Transfer-Encoding": "chunked",
    },
  });
});
