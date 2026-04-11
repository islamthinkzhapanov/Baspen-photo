import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  userSubscriptions,
  subscriptionPlans,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

// POST /api/billing/subscribe — subscribe to a plan (or change plan)
export const POST = withHandler(async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await request.json();
  if (!planId) {
    return NextResponse.json({ error: "planId required" }, { status: 400 });
  }

  // Verify plan exists and is active
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(
      and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, true))
    )
    .limit(1);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Cancel existing active subscription
  await db
    .update(userSubscriptions)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(userSubscriptions.userId, session.user.id),
        eq(userSubscriptions.status, "active")
      )
    );

  // Create new subscription
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const [sub] = await db
    .insert(userSubscriptions)
    .values({
      userId: session.user.id,
      planId,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    })
    .returning();

  // TODO: Integrate with actual payment provider (Kaspi Pay / Stripe)
  // For now, subscription activates immediately

  return NextResponse.json(sub, { status: 201 });
});
