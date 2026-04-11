import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, paymentTransactions, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { withHandler } from "@/lib/api-handler";

// GET /api/orders/[id]/callback -- payment provider redirects here after checkout
export const GET = withHandler(async function GET(
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

      // Send confirmation email
      if (order.email) {
        try {
          const [event] = await db
            .select({ title: events.title })
            .from(events)
            .where(eq(events.id, order.eventId))
            .limit(1);

          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          await sendOrderConfirmationEmail({
            to: order.email,
            orderId: order.id,
            totalAmount: order.totalAmount,
            currency: order.currency,
            photoCount: items.length,
            downloadToken: order.downloadToken,
            eventTitle: event?.title,
          });
        } catch (emailErr) {
          console.error("Failed to send order email:", emailErr);
        }
      }
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
});
