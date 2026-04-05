import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateEventSchema } from "@/lib/validators/event";

// GET /api/events/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

// PATCH /api/events/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.date) {
    updateData.date = new Date(parsed.data.date);
  }

  const [updated] = await db
    .update(events)
    .set(updateData)
    .where(and(eq(events.id, id), eq(events.ownerId, session.user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/events/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [deleted] = await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.ownerId, session.user.id)))
    .returning({ id: events.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
