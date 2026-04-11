import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, eventMembers, photographerBreaks } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

// GET /api/calendar/day?date=YYYY-MM-DD
export const GET = withHandler(async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "date param required (YYYY-MM-DD)" }, { status: 400 });
  }

  const userId = session.user.id;
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd = new Date(dateStr + "T23:59:59.999");

  // Events where user is a member, filtered by date
  const dayEvents = await db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      eventTime: events.eventTime,
      eventEndTime: events.eventEndTime,
      location: events.location,
      coverUrl: events.coverUrl,
      status: events.status,
    })
    .from(eventMembers)
    .innerJoin(events, eq(eventMembers.eventId, events.id))
    .where(
      and(
        eq(eventMembers.userId, userId),
        gte(events.date, dayStart),
        lt(events.date, dayEnd)
      )
    );

  // Breaks for this user on this date
  const dayBreaks = await db
    .select({
      id: photographerBreaks.id,
      startTime: photographerBreaks.startTime,
      endTime: photographerBreaks.endTime,
      reason: photographerBreaks.reason,
    })
    .from(photographerBreaks)
    .where(
      and(
        eq(photographerBreaks.ownerId, userId),
        gte(photographerBreaks.date, dayStart),
        lt(photographerBreaks.date, dayEnd)
      )
    );

  // Map events to calendar format
  const calendarEvents = dayEvents.map((e) => ({
    id: e.id,
    title: e.title,
    date: dateStr,
    startTime: e.eventTime ?? "10:00",
    endTime: e.eventEndTime ?? null,
    location: e.location,
    coverUrl: e.coverUrl,
    status: e.status,
  }));

  return NextResponse.json({
    date: dateStr,
    workStart: "08:00",
    workEnd: "22:00",
    calendarStep: 30,
    events: calendarEvents,
    breaks: dayBreaks,
  });
});
