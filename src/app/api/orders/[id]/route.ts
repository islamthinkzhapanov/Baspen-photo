import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, paymentTransactions, events } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/orders/[id] -- public order status (for checkout redirect)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalAmount: orders.totalAmount,
      currency: orders.currency,
      downloadToken: orders.downloadToken,
      downloadExpiresAt: orders.downloadExpiresAt,
      createdAt: orders.createdAt,
      eventTitle: events.title,
      eventSlug: events.slug,
    })
    .from(orders)
    .innerJoin(events, eq(orders.eventId, events.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Count items and detect package
  const [itemsAgg] = await db
    .select({
      count: sql<number>`count(*)::int`,
      isPackage: sql<boolean>`bool_or(${orderItems.type} = 'package')`,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  // Latest payment transaction
  const [tx] = await db
    .select({ provider: paymentTransactions.provider })
    .from(paymentTransactions)
    .where(eq(paymentTransactions.orderId, id))
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(1);

  return NextResponse.json({
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    photoCount: itemsAgg?.count ?? 0,
    isPackage: itemsAgg?.isPackage ?? false,
    eventTitle: order.eventTitle,
    eventSlug: order.eventSlug,
    downloadToken: order.status === "paid" ? order.downloadToken : null,
    downloadExpiresAt: order.status === "paid" ? order.downloadExpiresAt : null,
    paymentProvider: tx?.provider ?? "manual",
    createdAt: order.createdAt,
  });
}
