import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, paymentTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPaymentProvider } from "@/lib/payments/provider";

// POST /api/webhooks/payment -- payment provider webhook callback
export async function POST(request: Request) {
  const provider = request.headers.get("x-payment-provider") || "kaspi";
  const body = await request.json();
  const headers: Record<string, string> = {};

  request.headers.forEach((v, k) => {
    headers[k] = v;
  });

  const paymentProvider = getPaymentProvider(provider);
  const result = await paymentProvider.parseWebhook(body, headers);

  if (!result) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  // Find transaction by external ID
  const [tx] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.externalId, result.externalId))
    .limit(1);

  if (!tx) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  // Update transaction
  const newTxStatus =
    result.status === "succeeded"
      ? "succeeded"
      : result.status === "refunded"
        ? "refunded"
        : "failed";

  await db
    .update(paymentTransactions)
    .set({
      status: newTxStatus,
      providerData: result.rawData,
      updatedAt: new Date(),
    })
    .where(eq(paymentTransactions.id, tx.id));

  // Update order status
  const newOrderStatus =
    result.status === "succeeded"
      ? "paid"
      : result.status === "refunded"
        ? "refunded"
        : "pending";

  await db
    .update(orders)
    .set({ status: newOrderStatus, updatedAt: new Date() })
    .where(eq(orders.id, tx.orderId));

  return NextResponse.json({ received: true });
}
