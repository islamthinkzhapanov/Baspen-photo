import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  paymentTransactions,
  userSubscriptions,
  subscriptionPlans,
  events,
  users,
} from "@/lib/db/schema";
import { eq, sql, gte, lte, and, desc, count, sum } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

// GET /api/admin/finance — platform finance summary
export const GET = withHandler(async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateConditions = [];
  if (from) dateConditions.push(gte(orders.createdAt, new Date(from)));
  if (to) dateConditions.push(lte(orders.createdAt, new Date(to)));

  const orderWhere =
    dateConditions.length > 0
      ? and(eq(orders.status, "paid"), ...dateConditions)
      : eq(orders.status, "paid");

  // Revenue from photo sales
  const [revenueResult] = await db
    .select({
      totalRevenue: sum(orders.totalAmount),
      orderCount: count(),
    })
    .from(orders)
    .where(orderWhere);

  // Active subscriptions count + revenue
  const [subResult] = await db
    .select({
      activeCount: count(),
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.status, "active"));

  const [subRevenue] = await db
    .select({
      monthlyRevenue: sum(subscriptionPlans.priceMonthly),
    })
    .from(userSubscriptions)
    .innerJoin(
      subscriptionPlans,
      eq(userSubscriptions.planId, subscriptionPlans.id)
    )
    .where(eq(userSubscriptions.status, "active"));

  // Revenue by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const revenueByDay = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`.as("date"),
      amount: sum(orders.totalAmount),
    })
    .from(orders)
    .where(
      and(eq(orders.status, "paid"), gte(orders.createdAt, thirtyDaysAgo))
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  // Top earning events
  const topEvents = await db
    .select({
      eventId: orders.eventId,
      eventTitle: events.title,
      revenue: sum(orders.totalAmount),
      orderCount: count(),
    })
    .from(orders)
    .innerJoin(events, eq(orders.eventId, events.id))
    .where(eq(orders.status, "paid"))
    .groupBy(orders.eventId, events.title)
    .orderBy(desc(sum(orders.totalAmount)))
    .limit(10);

  return NextResponse.json({
    photoSalesRevenue: Number(revenueResult?.totalRevenue) || 0,
    photoSalesOrders: revenueResult?.orderCount || 0,
    activeSubscriptions: subResult?.activeCount || 0,
    subscriptionMonthlyRevenue: Number(subRevenue?.monthlyRevenue) || 0,
    revenueByDay,
    topEvents,
  });
});
