import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sponsorBlocks, events, eventMembers } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createSponsorSchema } from "@/lib/validators/sponsor";

// GET /api/events/[id]/sponsors
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const sponsors = await db
    .select()
    .from(sponsorBlocks)
    .where(eq(sponsorBlocks.eventId, id))
    .orderBy(asc(sponsorBlocks.sortOrder));

  return NextResponse.json(sponsors);
}

// POST /api/events/[id]/sponsors
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check ownership or membership
  const [event] = await db
    .select({ ownerId: events.ownerId })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.ownerId !== session.user.id) {
    const [member] = await db
      .select()
      .from(eventMembers)
      .where(
        and(
          eq(eventMembers.eventId, id),
          eq(eventMembers.userId, session.user.id)
        )
      )
      .limit(1);
    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await request.json();
  const parsed = createSponsorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [sponsor] = await db
    .insert(sponsorBlocks)
    .values({ eventId: id, ...parsed.data })
    .returning();

  return NextResponse.json(sponsor, { status: 201 });
}
