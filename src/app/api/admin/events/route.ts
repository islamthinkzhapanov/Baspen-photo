import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { events, users, photos } from "@/lib/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

// GET /api/admin/events — list all events with owner info
export const GET = withHandler(async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  const whereClause = search
    ? sql`${events.title} ILIKE ${"%" + search + "%"}`
    : undefined;

  const [allEvents, totalResult] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        date: events.date,
        location: events.location,
        pricingMode: events.pricingMode,
        isPublished: events.isPublished,
        photoCount: events.photoCount,
        createdAt: events.createdAt,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(events)
      .leftJoin(users, eq(events.ownerId, users.id))
      .where(whereClause)
      .orderBy(desc(events.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(events).where(whereClause),
  ]);

  return NextResponse.json({
    events: allEvents,
    total: totalResult[0]?.total || 0,
    page,
    limit,
  });
});

// DELETE /api/admin/events — delete event by id (body: { eventId })
export const DELETE = withHandler(async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { eventId } = body;

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(events)
    .where(eq(events.id, eventId))
    .returning({ id: events.id });

  if (!deleted) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
