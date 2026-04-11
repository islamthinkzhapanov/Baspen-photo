import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

// GET /api/billing/plans — list available plans
export const GET = withHandler(async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(subscriptionPlans.priceMonthly);

  return NextResponse.json(plans);
});
