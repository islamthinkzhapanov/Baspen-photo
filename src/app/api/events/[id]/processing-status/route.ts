import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getEventAccess } from "@/lib/event-auth";
import { withHandler } from "@/lib/api-handler";

// GET /api/events/[id]/processing-status — get photo processing stats
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

  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ready: sql<number>`count(*) filter (where ${photos.status} = 'ready')::int`,
      processing: sql<number>`count(*) filter (where ${photos.status} = 'processing')::int`,
      failed: sql<number>`count(*) filter (where ${photos.status} = 'failed')::int`,
      uploading: sql<number>`count(*) filter (where ${photos.status} = 'uploading')::int`,
    })
    .from(photos)
    .where(eq(photos.eventId, id));

  return NextResponse.json(stats);
});
