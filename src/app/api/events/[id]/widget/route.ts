import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { embedWidgets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createWidgetSchema } from "@/lib/validators/sponsor";
import { requireEventRole } from "@/lib/event-auth";
import { withHandler } from "@/lib/api-handler";

// GET /api/events/[id]/widget
export const GET = withHandler(async function GET(
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
});

// POST /api/events/[id]/widget -- create or update widget config
export const POST = withHandler(async function POST(
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
});
