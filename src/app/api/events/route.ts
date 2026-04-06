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

  // Events where user is a member (includes owner members and photographers)
  const memberRows = await db
    .select({ event: events, role: eventMembers.role })
    .from(eventMembers)
    .innerJoin(events, eq(eventMembers.eventId, events.id))
    .where(eq(eventMembers.userId, userId))
    .orderBy(desc(events.createdAt));

  // Also find events where user is ownerId but not yet in eventMembers (legacy)
  const ownedEvents = await db
    .select()
    .from(events)
    .where(eq(events.ownerId, userId))
    .orderBy(desc(events.createdAt));

  // Build map with role info
  const eventMap = new Map<string, { currentUserRole: string }>();
  const result: (typeof ownedEvents[number] & { currentUserRole: string })[] = [];

  for (const row of memberRows) {
    if (!eventMap.has(row.event.id)) {
      eventMap.set(row.event.id, { currentUserRole: row.role });
      result.push({ ...row.event, currentUserRole: row.role });
    }
  }

  // Add legacy owned events not in eventMembers
  for (const event of ownedEvents) {
    if (!eventMap.has(event.id)) {
      eventMap.set(event.id, { currentUserRole: "owner" });
      result.push({ ...event, currentUserRole: "owner" });
    }
  }

  return NextResponse.json(result);
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

  // Add creator as event member with owner role
  await db.insert(eventMembers).values({
    eventId: event.id,
    userId: session.user.id,
    role: "owner",
    acceptedAt: new Date(),
  });

  return NextResponse.json(event, { status: 201 });
}
