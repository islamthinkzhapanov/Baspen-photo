import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/billing/cancel — cancel active subscription
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [updated] = await db
    .update(userSubscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userSubscriptions.userId, session.user.id),
        eq(userSubscriptions.status, "active")
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
