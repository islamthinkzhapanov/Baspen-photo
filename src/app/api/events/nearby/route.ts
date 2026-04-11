import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { haversineDistance } from "@/lib/utils/geo";
import { withHandler } from "@/lib/api-handler";

/**
 * GET /api/events/nearby?lat=XX&lng=YY — Find published events near a location.
 *
 * Returns events whose geofence includes the given coordinates,
 * sorted by distance (closest first).
 */
export const GET = withHandler(async function GET(request: NextRequest) {
  const lat = parseFloat(request.nextUrl.searchParams.get("lat") || "");
  const lng = parseFloat(request.nextUrl.searchParams.get("lng") || "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Missing or invalid lat/lng" },
      { status: 400 }
    );
  }

  // Fetch all published events with geofence
  const geoEvents = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      description: events.description,
      date: events.date,
      location: events.location,
      branding: events.branding,
      geofence: events.geofence,
      photoCount: events.photoCount,
    })
    .from(events)
    .where(
      and(
        eq(events.isPublished, true),
        // Only events with geofence set
        sql`${events.geofence} IS NOT NULL`
      )
    );

  // Filter by distance and sort
  const nearby = geoEvents
    .filter((e) => {
      if (!e.geofence) return false;
      const fence = e.geofence as { lat: number; lng: number; radiusKm: number };
      const dist = haversineDistance(lat, lng, fence.lat, fence.lng);
      return dist <= fence.radiusKm;
    })
    .map((e) => {
      const fence = e.geofence as { lat: number; lng: number; radiusKm: number };
      const distance = haversineDistance(lat, lng, fence.lat, fence.lng);
      return { ...e, distance: Math.round(distance * 100) / 100 };
    })
    .sort((a, b) => a.distance - b.distance);

  return NextResponse.json({ events: nearby });
});
