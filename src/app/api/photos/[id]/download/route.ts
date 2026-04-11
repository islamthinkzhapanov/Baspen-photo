import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, events, orders, orderItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getDownloadUrl } from "@/lib/storage/s3";
import { withHandler } from "@/lib/api-handler";

// GET /api/photos/[id]/download -- get a signed download URL for a photo
export const GET = withHandler(async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const downloadToken = url.searchParams.get("token");

  const [photo] = await db
    .select({
      id: photos.id,
      eventId: photos.eventId,
      storagePath: photos.storagePath,
      watermarkedPath: photos.watermarkedPath,
      originalFilename: photos.originalFilename,
      status: photos.status,
    })
    .from(photos)
    .where(eq(photos.id, id))
    .limit(1);

  if (!photo || photo.status !== "ready") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check event settings
  const [event] = await db
    .select({ settings: events.settings })
    .from(events)
    .where(eq(events.id, photo.eventId))
    .limit(1);

  const isFreeDownload = event?.settings?.freeDownload === true;

  if (isFreeDownload) {
    const signedUrl = await getDownloadUrl(photo.storagePath, 3600);
    return NextResponse.json({
      url: signedUrl,
      filename: photo.originalFilename || "photo.jpg",
      watermarked: false,
    });
  }

  // Check if user has purchased this photo via download token
  if (downloadToken) {
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.downloadToken, downloadToken),
          eq(orders.status, "paid"),
          eq(orderItems.photoId, id)
        )
      )
      .limit(1);

    if (order) {
      const signedUrl = await getDownloadUrl(photo.storagePath, 3600);
      return NextResponse.json({
        url: signedUrl,
        filename: photo.originalFilename || "photo.jpg",
        watermarked: false,
      });
    }
  }

  // No purchase -- return watermarked version
  const watermarkedKey =
    photo.watermarkedPath ||
    photo.storagePath.replace("/originals/", "/watermarked/");
  const signedUrl = await getDownloadUrl(watermarkedKey, 3600);
  return NextResponse.json({
    url: signedUrl,
    filename: photo.originalFilename || "photo.jpg",
    watermarked: true,
  });
});
