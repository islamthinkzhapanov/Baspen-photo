import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { photographerBreaks } from "@/lib/db/schema";
import { createBreakSchema } from "@/lib/validators/break";
import { withHandler } from "@/lib/api-handler";

// POST /api/breaks — create a break
export const POST = withHandler(async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createBreakSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(photographerBreaks)
    .values({
      ownerId: session.user.id,
      date: new Date(parsed.data.date + "T00:00:00"),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      reason: parsed.data.reason ?? null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
});
