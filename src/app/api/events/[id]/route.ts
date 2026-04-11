import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateEventSchema } from "@/lib/validators/event";
import { getEventAccess, requireEventRole } from "@/lib/event-auth";
import { deleteCollection, getCollectionId } from "@/lib/rekognition/client";
import { withHandler } from "@/lib/api-handler";

// GET /api/events/[id]
export const GET = withHandler(async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getEventAccess(id, session.user.id);
  if (!access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ...event, currentUserRole: access.role });
});

// PATCH /api/events/[id]
export const PATCH = withHandler(async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { denied } = await requireEventRole(id, session.user.id, "owner");
  if (denied) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    .where(eq(events.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
});

// DELETE /api/events/[id]
export const DELETE = withHandler(async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { denied } = await requireEventRole(id, session.user.id, "owner");
  if (denied) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete Rekognition collection before removing event from DB
  try {
    await deleteCollection(getCollectionId(id));
  } catch (err) {
    console.error("[events] Failed to delete Rekognition collection:", err);
  }

  const [deleted] = await db
    .delete(events)
    .where(eq(events.id, id))
    .returning({ id: events.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
