import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

// GET /api/billing/subscription — get user's current subscription
export const GET = withHandler(async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sub] = await db
    .select({
      id: userSubscriptions.id,
      status: userSubscriptions.status,
      currentPeriodStart: userSubscriptions.currentPeriodStart,
      currentPeriodEnd: userSubscriptions.currentPeriodEnd,
      cancelledAt: userSubscriptions.cancelledAt,
      planName: subscriptionPlans.name,
      planPrice: subscriptionPlans.priceMonthly,
      maxEvents: subscriptionPlans.maxEvents,
      maxPhotosPerEvent: subscriptionPlans.maxPhotosPerEvent,
      maxStorageGb: subscriptionPlans.maxStorageGb,
    })
    .from(userSubscriptions)
    .innerJoin(
      subscriptionPlans,
      eq(userSubscriptions.planId, subscriptionPlans.id)
    )
    .where(
      and(
        eq(userSubscriptions.userId, session.user.id),
        eq(userSubscriptions.status, "active")
      )
    )
    .orderBy(desc(userSubscriptions.createdAt))
    .limit(1);

  return NextResponse.json(sub || null);
});
