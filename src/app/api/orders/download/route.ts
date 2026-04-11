import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, photos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getDownloadUrl } from "@/lib/storage/s3";
import { withHandler } from "@/lib/api-handler";

// GET /api/orders/download?token=xxx -- get download URLs for paid photos
export const GET = withHandler(async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(eq(orders.downloadToken, token), eq(orders.status, "paid"))
    )
    .limit(1);

  if (!order) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 404 }
    );
  }

  // Check expiration
  if (order.downloadExpiresAt && order.downloadExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "Download link expired" },
      { status: 410 }
    );
  }

  // Get order items with photo paths
  const items = await db
    .select({
      photoId: orderItems.photoId,
      storagePath: photos.storagePath,
      originalFilename: photos.originalFilename,
      thumbnailPath: photos.thumbnailPath,
    })
    .from(orderItems)
    .innerJoin(photos, eq(orderItems.photoId, photos.id))
    .where(eq(orderItems.orderId, order.id));

  // Generate signed download URLs for originals (no watermark)
  const downloads = await Promise.all(
    items.map(async (item) => ({
      photoId: item.photoId,
      filename: item.originalFilename || "photo.jpg",
      thumbnailUrl: item.thumbnailPath
        ? await getDownloadUrl(item.thumbnailPath, 3600)
        : null,
      downloadUrl: await getDownloadUrl(item.storagePath, 3600),
    }))
  );

  return NextResponse.json({
    orderId: order.id,
    totalAmount: order.totalAmount,
    currency: order.currency,
    expiresAt: order.downloadExpiresAt,
    photos: downloads,
  });
});
