import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  paymentTransactions,
  photos,
  events,
  participants,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createOrderSchema } from "@/lib/validators/order";
import {
  calculatePhotoPrice,
  calculateOrderTotal,
  getPaymentProvider,
} from "@/lib/payments/provider";
import { nanoid } from "nanoid";

// POST /api/orders -- create a new order (participant purchase)
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { eventId, photoIds, isPackage, email, phone, paymentMethod, sessionToken } =
    parsed.data;

  // Get event with pricing
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.settings?.freeDownload) {
    return NextResponse.json(
      { error: "This event offers free downloads" },
      { status: 400 }
    );
  }

  // Verify photos exist and belong to event
  const eventPhotos = await db
    .select({ id: photos.id })
    .from(photos)
    .where(and(eq(photos.eventId, eventId), inArray(photos.id, photoIds)));

  if (eventPhotos.length !== photoIds.length) {
    return NextResponse.json(
      { error: "Some photos not found" },
      { status: 400 }
    );
  }

  // Package validation: must include ALL ready event photos, minimum 3
  if (isPackage) {
    const allReadyPhotos = await db
      .select({ id: photos.id })
      .from(photos)
      .where(and(eq(photos.eventId, eventId), eq(photos.status, "ready")));

    if (allReadyPhotos.length < 3) {
      return NextResponse.json(
        { error: "Package discount requires at least 3 photos" },
        { status: 400 }
      );
    }

    const allIds = new Set(allReadyPhotos.map((p) => p.id));
    const submittedIds = new Set(photoIds);
    if (allIds.size !== submittedIds.size || ![...allIds].every((id) => submittedIds.has(id))) {
      return NextResponse.json(
        { error: "Package must include all event photos" },
        { status: 400 }
      );
    }
  }

  // Calculate pricing
  const pricing = calculatePhotoPrice(event);
  const totalAmount = calculateOrderTotal(
    pricing.pricePerPhoto,
    photoIds.length,
    isPackage,
    pricing.packageDiscount
  );

  // Resolve participant
  let participantId: string | undefined;
  if (sessionToken) {
    const [participant] = await db
      .select({ id: participants.id })
      .from(participants)
      .where(eq(participants.sessionToken, sessionToken))
      .limit(1);
    participantId = participant?.id;
  }

  const downloadToken = nanoid(32);
  const downloadExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create order
  const [order] = await db
    .insert(orders)
    .values({
      eventId,
      participantId,
      email,
      phone,
      totalAmount,
      currency: "KZT",
      downloadToken,
      downloadExpiresAt,
    })
    .returning();

  // Create order items with correct price distribution
  const itemType = isPackage ? ("package" as const) : ("single" as const);
  const basePrice = isPackage
    ? Math.floor(totalAmount / photoIds.length)
    : pricing.pricePerPhoto;
  const remainder = isPackage
    ? totalAmount - basePrice * photoIds.length
    : 0;

  const itemValues = photoIds.map((photoId, index) => ({
    orderId: order.id,
    photoId,
    type: itemType,
    price: basePrice + (index < remainder ? 1 : 0),
  }));

  await db.insert(orderItems).values(itemValues);

  // Create payment
  const provider = getPaymentProvider(paymentMethod);
  const origin =
    request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "";
  const paymentResult = await provider.createPayment({
    orderId: order.id,
    amount: totalAmount,
    currency: "KZT",
    description: `Photos from ${event.title}`,
    returnUrl: `${origin}/api/orders/${order.id}/callback`,
    customerEmail: email,
    customerPhone: phone,
    metadata: { eventId, photoCount: String(photoIds.length) },
  });

  // Record transaction
  await db.insert(paymentTransactions).values({
    orderId: order.id,
    provider: paymentMethod,
    externalId: paymentResult.externalId,
    status: paymentResult.status,
    amount: totalAmount,
    currency: "KZT",
    providerData: paymentResult.providerData,
  });

  // If manual payment -> mark paid immediately
  if (paymentMethod === "manual" && paymentResult.status === "succeeded") {
    await db
      .update(orders)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(orders.id, order.id));
  }

  return NextResponse.json({
    orderId: order.id,
    totalAmount,
    currency: "KZT",
    downloadToken:
      paymentResult.status === "succeeded" ? downloadToken : undefined,
    redirectUrl: paymentResult.redirectUrl,
    status: paymentResult.status === "succeeded" ? "paid" : "pending",
    pricing: {
      pricePerPhoto: pricing.pricePerPhoto,
      photoCount: photoIds.length,
      isPackage,
      packageDiscount: isPackage ? pricing.packageDiscount : 0,
    },
  });
}
