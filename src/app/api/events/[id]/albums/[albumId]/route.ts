import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { albums } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateAlbumSchema } from "@/lib/validators/album";
import { requireEventRole } from "@/lib/event-auth";

// PATCH /api/events/[id]/albums/[albumId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; albumId: string }> }
) {
  const { id, albumId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { denied } = await requireEventRole(id, session.user.id, "owner");
  if (denied) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateAlbumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(albums)
    .set(parsed.data)
    .where(
      and(
        eq(albums.id, albumId),
        eq(albums.eventId, id)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/events/[id]/albums/[albumId]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; albumId: string }> }
) {
  const { id, albumId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { denied } = await requireEventRole(id, session.user.id, "owner");
  if (denied) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [deleted] = await db
    .delete(albums)
    .where(
      and(
        eq(albums.id, albumId),
        eq(albums.eventId, id)
      )
    )
    .returning({ id: albums.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
