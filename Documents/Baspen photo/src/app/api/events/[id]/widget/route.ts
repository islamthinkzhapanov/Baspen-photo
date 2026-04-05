import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { embedWidgets, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createWidgetSchema } from "@/lib/validators/sponsor";

// GET /api/events/[id]/widget
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [widget] = await db
    .select()
    .from(embedWidgets)
    .where(eq(embedWidgets.eventId, id))
    .limit(1);

  return NextResponse.json(widget || null);
}

// POST /api/events/[id]/widget -- create or update widget config
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [event] = await db
    .select({ ownerId: events.ownerId })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (!event || event.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createWidgetSchema.safeParse({ ...body, eventId: id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Upsert: check if widget exists
  const [existing] = await db
    .select({ id: embedWidgets.id })
    .from(embedWidgets)
    .where(eq(embedWidgets.eventId, id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(embedWidgets)
      .set({
        customDomain: parsed.data.customDomain,
        config: parsed.data.config,
      })
      .where(eq(embedWidgets.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(embedWidgets)
    .values({
      eventId: id,
      customDomain: parsed.data.customDomain,
      config: parsed.data.config,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
