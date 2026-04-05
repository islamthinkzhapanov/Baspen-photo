import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, eventMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createEventSchema } from "@/lib/validators/event";

// GET /api/events — list user's events
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Events where user is owner or member
  const ownedEvents = await db
    .select()
    .from(events)
    .where(eq(events.ownerId, userId))
    .orderBy(desc(events.createdAt));

  const memberEvents = await db
    .select({ event: events })
    .from(eventMembers)
    .innerJoin(events, eq(eventMembers.eventId, events.id))
    .where(eq(eventMembers.userId, userId));

  const allEvents = [
    ...ownedEvents,
    ...memberEvents.map((m) => m.event),
  ];

  // Deduplicate
  const seen = new Set<string>();
  const unique = allEvents.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  return NextResponse.json(unique);
}

// POST /api/events — create event
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check slug uniqueness
  const existingSlug = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.slug, parsed.data.slug))
    .limit(1);

  if (existingSlug.length > 0) {
    return NextResponse.json(
      { error: "Slug already taken" },
      { status: 409 }
    );
  }

  const [event] = await db
    .insert(events)
    .values({
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : null,
      ownerId: session.user.id,
    })
    .returning();

  return NextResponse.json(event, { status: 201 });
}
