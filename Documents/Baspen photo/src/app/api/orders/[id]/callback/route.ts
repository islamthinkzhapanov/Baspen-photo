import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, paymentTransactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/orders/[id]/callback -- payment provider redirects here after checkout
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check latest transaction status
  const [tx] = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.orderId, id),
        eq(paymentTransactions.status, "succeeded")
      )
    )
    .limit(1);

  if (tx || order.status === "paid") {
    // Mark order as paid if not already
    if (order.status !== "paid") {
      await db
        .update(orders)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(orders.id, id));
    }

    // Redirect to download page with token
    const baseUrl = url.origin;
    return NextResponse.redirect(
      `${baseUrl}/download?token=${order.downloadToken}`
    );
  }

  // Payment not completed yet
  const baseUrl = url.origin;
  return NextResponse.redirect(`${baseUrl}/order/${id}?status=pending`);
}
