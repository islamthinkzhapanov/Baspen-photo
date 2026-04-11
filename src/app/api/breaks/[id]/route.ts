import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { photographerBreaks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateBreakSchema } from "@/lib/validators/break";
import { withHandler } from "@/lib/api-handler";

// PATCH /api/breaks/[id] — update a break
export const PATCH = withHandler(async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateBreakSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(photographerBreaks)
    .set(parsed.data)
    .where(
      and(
        eq(photographerBreaks.id, id),
        eq(photographerBreaks.ownerId, session.user.id)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
});

// DELETE /api/breaks/[id] — delete a break
export const DELETE = withHandler(async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [deleted] = await db
    .delete(photographerBreaks)
    .where(
      and(
        eq(photographerBreaks.id, id),
        eq(photographerBreaks.ownerId, session.user.id)
      )
    )
    .returning({ id: photographerBreaks.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
