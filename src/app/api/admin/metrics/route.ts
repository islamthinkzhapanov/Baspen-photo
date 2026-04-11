import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  users,
  events,
  photos,
  participants,
  orders,
  userSubscriptions,
} from "@/lib/db/schema";
import { count, sql, gte, eq } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

// GET /api/admin/metrics — platform-wide metrics
export const GET = withHandler(async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    [totalUsers],
    [totalEvents],
    [totalPhotos],
    [totalParticipants],
    [totalOrders],
    [activeSubscriptions],
    [newUsersMonth],
    [newEventsMonth],
    [newPhotosMonth],
    usersPerDay,
    eventsPerMonth,
    photoVolume,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(events),
    db.select({ value: count() }).from(photos),
    db.select({ value: count() }).from(participants),
    db.select({ value: count() }).from(orders).where(eq(orders.status, "paid")),
    db
      .select({ value: count() })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.status, "active")),
    db
      .select({ value: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo)),
    db
      .select({ value: count() })
      .from(events)
      .where(gte(events.createdAt, thirtyDaysAgo)),
    db
      .select({ value: count() })
      .from(photos)
      .where(gte(photos.createdAt, thirtyDaysAgo)),
    // Users registered per day (last 30 days)
    db
      .select({
        date: sql<string>`DATE(${users.createdAt})`.as("date"),
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`),
    // Events created per month (last 6 months)
    db
      .select({
        month: sql<string>`TO_CHAR(${events.createdAt}, 'YYYY-MM')`.as("month"),
        count: count(),
      })
      .from(events)
      .groupBy(sql`TO_CHAR(${events.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${events.createdAt}, 'YYYY-MM')`)
      .limit(6),
    // Total photos storage estimate (sum of fileSize)
    db
      .select({
        totalBytes: sql<string>`COALESCE(SUM(${photos.fileSize}), 0)`.as(
          "totalBytes"
        ),
      })
      .from(photos),
  ]);

  return NextResponse.json({
    totals: {
      users: totalUsers?.value || 0,
      events: totalEvents?.value || 0,
      photos: totalPhotos?.value || 0,
      participants: totalParticipants?.value || 0,
      orders: totalOrders?.value || 0,
      activeSubscriptions: activeSubscriptions?.value || 0,
    },
    monthGrowth: {
      newUsers: newUsersMonth?.value || 0,
      newEvents: newEventsMonth?.value || 0,
      newPhotos: newPhotosMonth?.value || 0,
    },
    charts: {
      usersPerDay,
      eventsPerMonth,
    },
    storage: {
      totalBytes: Number(photoVolume[0]?.totalBytes) || 0,
    },
  });
});
