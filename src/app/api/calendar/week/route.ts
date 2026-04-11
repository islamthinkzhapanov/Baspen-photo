import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, eventMembers, photographerBreaks } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { withHandler } from "@/lib/api-handler";

function getWeekRange(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  return { monday, sunday };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// GET /api/calendar/week?date=YYYY-MM-DD
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
  const { monday, sunday } = getWeekRange(dateStr);

  // Events for the week
  const weekEvents = await db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      eventTime: events.eventTime,
      eventEndTime: events.eventEndTime,
      location: events.location,
      coverUrl: events.coverUrl,
    })
    .from(eventMembers)
    .innerJoin(events, eq(eventMembers.eventId, events.id))
    .where(
      and(
        eq(eventMembers.userId, userId),
        gte(events.date, monday),
        lt(events.date, sunday)
      )
    );

  // Breaks for the week
  const weekBreaks = await db
    .select({
      id: photographerBreaks.id,
      date: photographerBreaks.date,
      startTime: photographerBreaks.startTime,
      endTime: photographerBreaks.endTime,
      reason: photographerBreaks.reason,
    })
    .from(photographerBreaks)
    .where(
      and(
        eq(photographerBreaks.ownerId, userId),
        gte(photographerBreaks.date, monday),
        lt(photographerBreaks.date, sunday)
      )
    );

  // Group by day
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayStr = formatDate(d);

    days.push({
      date: dayStr,
      dayOfWeek: d.getDay(),
      events: weekEvents
        .filter((e) => e.date && formatDate(e.date) === dayStr)
        .map((e) => ({
          id: e.id,
          title: e.title,
          date: dayStr,
          startTime: e.eventTime ?? "10:00",
          endTime: e.eventEndTime ?? null,
          location: e.location,
          coverUrl: e.coverUrl,
        })),
      breaks: weekBreaks
        .filter((b) => formatDate(b.date) === dayStr)
        .map((b) => ({
          id: b.id,
          startTime: b.startTime,
          endTime: b.endTime,
          reason: b.reason,
        })),
    });
  }

  return NextResponse.json({
    weekStart: formatDate(monday),
    weekEnd: formatDate(new Date(sunday.getTime() - 1)),
    workStart: "08:00",
    workEnd: "22:00",
    calendarStep: 30,
    days,
  });
});
