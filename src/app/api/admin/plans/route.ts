import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { subscriptionPlans, userSubscriptions } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { z } from "zod";
import { withHandler } from "@/lib/api-handler";

const planSchema = z.object({
  name: z.string().min(1).max(100),
  maxEvents: z.number().int().min(1),
  maxPhotosPerEvent: z.number().int().min(100),
  maxStorageGb: z.number().int().min(1),
  priceMonthly: z.number().int().min(0),
  isActive: z.boolean().optional(),
});

// GET /api/admin/plans — list all plans with subscriber counts
export const GET = withHandler(async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const plans = await db
    .select({
      id: subscriptionPlans.id,
      name: subscriptionPlans.name,
      maxEvents: subscriptionPlans.maxEvents,
      maxPhotosPerEvent: subscriptionPlans.maxPhotosPerEvent,
      maxStorageGb: subscriptionPlans.maxStorageGb,
      priceMonthly: subscriptionPlans.priceMonthly,
      isActive: subscriptionPlans.isActive,
      createdAt: subscriptionPlans.createdAt,
    })
    .from(subscriptionPlans)
    .orderBy(subscriptionPlans.priceMonthly);

  // Get subscriber count per plan
  const subCounts = await db
    .select({
      planId: userSubscriptions.planId,
      count: count(),
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.status, "active"))
    .groupBy(userSubscriptions.planId);

  const countMap = new Map(subCounts.map((s) => [s.planId, s.count]));

  const enriched = plans.map((p) => ({
    ...p,
    subscriberCount: countMap.get(p.id) || 0,
  }));

  return NextResponse.json(enriched);
});

// POST /api/admin/plans — create plan
export const POST = withHandler(async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [plan] = await db
    .insert(subscriptionPlans)
    .values(parsed.data)
    .returning();

  return NextResponse.json(plan, { status: 201 });
});

// PATCH /api/admin/plans — update plan
export const PATCH = withHandler(async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "Plan id required" }, { status: 400 });
  }

  const parsed = planSchema.partial().safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(subscriptionPlans)
    .set(parsed.data)
    .where(eq(subscriptionPlans.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
});
