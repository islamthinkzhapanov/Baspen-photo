import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, photos } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { calculatePhotoPrice, calculateOrderTotal } from "@/lib/payments/provider";

// GET /api/events/[id]/pricing -- get pricing info for an event (public)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.isPublished, true)))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (event.settings?.freeDownload) {
    return NextResponse.json({
      freeDownload: true,
      pricePerPhoto: 0,
      packageDiscount: 0,
      currency: "KZT",
    });
  }

  const pricing = calculatePhotoPrice(event);

  // Count total ready photos for package pricing
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(photos)
    .where(and(eq(photos.eventId, id), eq(photos.status, "ready")));

  const totalPhotos = count ?? 0;
  const packageEligible = totalPhotos >= 3;
  const packageTotal = packageEligible
    ? calculateOrderTotal(pricing.pricePerPhoto, totalPhotos, true, pricing.packageDiscount)
    : null;

  return NextResponse.json({
    freeDownload: false,
    pricePerPhoto: pricing.pricePerPhoto,
    packageDiscount: pricing.packageDiscount,
    currency: "KZT",
    pricingMode: event.pricingMode,
    totalPhotos,
    packageEligible,
    packageTotal,
  });
}
