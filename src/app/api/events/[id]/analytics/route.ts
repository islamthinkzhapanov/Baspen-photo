import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  events,
  photos,
  participants,
  participantMatches,
  orders,
  orderItems,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, count as countFn } from "drizzle-orm";
import { requireEventRole } from "@/lib/event-auth";

// GET /api/events/[id]/analytics?from=&to=
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Analytics are owner-only
  const { denied } = await requireEventRole(id, session.user.id, "owner");
  if (denied) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const dateFrom = from ? new Date(from) : new Date(0);
  const dateTo = to ? new Date(to) : new Date();

  // Total photos
  const [photoStats] = await db
    .select({ total: countFn() })
    .from(photos)
    .where(
      and(
        eq(photos.eventId, id),
        gte(photos.createdAt, dateFrom),
        lte(photos.createdAt, dateTo)
      )
    );

  // Total participants (searches)
  const [participantStats] = await db
    .select({ total: countFn() })
    .from(participants)
    .where(
      and(
        eq(participants.eventId, id),
        gte(participants.createdAt, dateFrom),
        lte(participants.createdAt, dateTo)
      )
    );

  // Total matches (downloads/views)
  const [matchStats] = await db
    .select({ total: countFn() })
    .from(participantMatches)
    .innerJoin(
      participants,
      eq(participantMatches.participantId, participants.id)
    )
    .where(
      and(
        eq(participants.eventId, id),
        gte(participantMatches.createdAt, dateFrom),
        lte(participantMatches.createdAt, dateTo)
      )
    );

  // Orders and revenue
  const [orderStats] = await db
    .select({
      totalOrders: countFn(),
      totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.eventId, id),
        eq(orders.status, "paid"),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      )
    );

  // Revenue by day (last 30 days)
  const revenueByDay = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<number>`SUM(${orders.totalAmount})`,
      count: countFn(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.eventId, id),
        eq(orders.status, "paid"),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  // Most purchased photos (top 10)
  const popularPhotos = await db
    .select({
      photoId: orderItems.photoId,
      thumbnailPath: photos.thumbnailPath,
      purchaseCount: countFn(),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(photos, eq(orderItems.photoId, photos.id))
    .where(
      and(
        eq(orders.eventId, id),
        eq(orders.status, "paid"),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      )
    )
    .groupBy(orderItems.photoId, photos.thumbnailPath)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);

  // Search type breakdown (face vs number)
  const faceSearches = await db
    .select({ total: countFn() })
    .from(participants)
    .where(
      and(
        eq(participants.eventId, id),
        sql`${participants.bibNumber} IS NULL`,
        gte(participants.createdAt, dateFrom),
        lte(participants.createdAt, dateTo)
      )
    );

  const numberSearches = await db
    .select({ total: countFn() })
    .from(participants)
    .where(
      and(
        eq(participants.eventId, id),
        sql`${participants.bibNumber} IS NOT NULL`,
        gte(participants.createdAt, dateFrom),
        lte(participants.createdAt, dateTo)
      )
    );

  return NextResponse.json({
    totalPhotos: Number(photoStats.total),
    totalParticipants: Number(participantStats.total),
    totalMatches: Number(matchStats.total),
    totalOrders: Number(orderStats.totalOrders),
    totalRevenue: Number(orderStats.totalRevenue),
    revenueByDay: revenueByDay.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue),
      orders: Number(r.count),
    })),
    popularPhotos: popularPhotos.map((p) => ({
      photoId: p.photoId,
      thumbnailPath: p.thumbnailPath,
      purchaseCount: Number(p.purchaseCount),
    })),
    searchBreakdown: {
      face: Number(faceSearches[0]?.total || 0),
      number: Number(numberSearches[0]?.total || 0),
    },
  });
}
