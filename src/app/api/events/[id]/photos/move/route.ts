import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { movePhotosSchema } from "@/lib/validators/album";
import { getEventAccess } from "@/lib/event-auth";

// POST /api/events/[id]/photos/move — bulk move photos to album
export async function POST(
  request: Request,
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

  const body = await request.json();
  const parsed = movePhotosSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { photoIds, albumId } = parsed.data;

  await db
    .update(photos)
    .set({ albumId })
    .where(
      and(
        eq(photos.eventId, id),
        inArray(photos.id, photoIds)
      )
    );

  return NextResponse.json({ success: true, moved: photoIds.length });
}
