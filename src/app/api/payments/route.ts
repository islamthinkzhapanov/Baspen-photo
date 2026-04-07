import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  paymentTransactions,
  events,
} from "@/lib/db/schema";
import { eq, and, sql, count as countFn, inArray } from "drizzle-orm";

// GET /api/payments — organizer payment dashboard data
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get all events owned by this user
  const userEvents = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(eq(events.ownerId, userId));

  if (userEvents.length === 0) {
    return NextResponse.json({
      transactions: [],
      stats: {
        totalEarned: 0,
        pending: 0,
        pendingCount: 0,
      },
    });
  }

  const eventIds = userEvents.map((e) => e.id);
  const eventTitleMap = Object.fromEntries(
    userEvents.map((e) => [e.id, e.title])
  );

  // Fetch all orders for organizer's events with their transactions
  const allOrders = await db
    .select({
      id: orders.id,
      eventId: orders.eventId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      currency: orders.currency,
      email: orders.email,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(inArray(orders.eventId, eventIds))
    .orderBy(sql`${orders.createdAt} DESC`);

  // Fetch order item counts per order
  const orderIds = allOrders.map((o) => o.id);

  let itemCountMap: Record<string, number> = {};
  let txMap: Record<
    string,
    { provider: string; status: string }
  > = {};

  if (orderIds.length > 0) {
    const itemCounts = await db
      .select({
        orderId: orderItems.orderId,
        count: countFn(),
        type: orderItems.type,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds))
      .groupBy(orderItems.orderId, orderItems.type);

    for (const row of itemCounts) {
      itemCountMap[row.orderId] = Number(row.count);
    }

    // Fetch latest transaction per order
    const txRows = await db
      .select({
        orderId: paymentTransactions.orderId,
        provider: paymentTransactions.provider,
        status: paymentTransactions.status,
      })
      .from(paymentTransactions)
      .where(inArray(paymentTransactions.orderId, orderIds));

    for (const row of txRows) {
      txMap[row.orderId] = { provider: row.provider, status: row.status };
    }
  }

  // Build transactions list
  const transactions = allOrders.map((order) => {
    const photoCount = itemCountMap[order.id] || 0;
    const tx = txMap[order.id];
    const providerLabel =
      tx?.provider === "kaspi"
        ? "Kaspi Pay"
        : tx?.provider === "stripe"
          ? "Stripe"
          : tx?.provider === "manual"
            ? "Ручной"
            : "—";

    let status: "completed" | "pending" | "failed" | "refunded" = "pending";
    if (order.status === "paid") status = "completed";
    else if (order.status === "expired") status = "failed";
    else if (order.status === "refunded") status = "refunded";

    return {
      id: order.id,
      type: "income" as const,
      description:
        photoCount > 0 ? `Покупка ${photoCount} фото` : "Заказ",
      event: eventTitleMap[order.eventId] || "—",
      amount: order.totalAmount,
      currency: order.currency,
      status,
      date: order.createdAt.toISOString(),
      method: providerLabel,
    };
  });

  // Calculate stats
  const totalEarned = allOrders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = allOrders.filter((o) => o.status === "pending");
  const pending = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = pendingOrders.length;

  return NextResponse.json({
    transactions,
    stats: {
      totalEarned,
      pending,
      pendingCount,
    },
  });
}
