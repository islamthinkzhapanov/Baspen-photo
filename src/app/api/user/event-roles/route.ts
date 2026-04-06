import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, eventMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [ownedEvents, assignments] = await Promise.all([
    db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.ownerId, userId)),
    db
      .select({ eventId: eventMembers.eventId })
      .from(eventMembers)
      .where(
        and(
          eq(eventMembers.userId, userId),
          eq(eventMembers.role, "photographer")
        )
      ),
  ]);

  return NextResponse.json({
    ownsEvents: ownedEvents.length > 0,
    hasAssignments: assignments.length > 0,
    ownedEventIds: ownedEvents.map((e) => e.id),
  });
}
