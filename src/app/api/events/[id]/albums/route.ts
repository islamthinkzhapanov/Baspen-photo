import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { albums, photos } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { createAlbumSchema, reorderAlbumsSchema } from "@/lib/validators/album";
import { requireEventRole, getEventAccess } from "@/lib/event-auth";

// GET /api/events/[id]/albums
export async function GET(
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

  const result = await db
    .select({
      id: albums.id,
      eventId: albums.eventId,
      name: albums.name,
      sortOrder: albums.sortOrder,
      createdAt: albums.createdAt,
      photoCount: sql<number>`(
        SELECT COUNT(*)::int FROM photos
        WHERE photos.album_id = ${albums.id}
      )`,
    })
    .from(albums)
    .where(eq(albums.eventId, id))
    .orderBy(asc(albums.sortOrder));

  return NextResponse.json(result);
}

// POST /api/events/[id]/albums
export async function POST(
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
  const parsed = createAlbumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Auto-set sortOrder to max+1 if default 0
  let sortOrder = parsed.data.sortOrder;
  if (sortOrder === 0) {
    const [max] = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${albums.sortOrder}), -1)` })
      .from(albums)
      .where(eq(albums.eventId, id));
    sortOrder = (max?.maxOrder ?? -1) + 1;
  }

  const [album] = await db
    .insert(albums)
    .values({ eventId: id, name: parsed.data.name, sortOrder })
    .returning();

  return NextResponse.json(album, { status: 201 });
}

// PUT /api/events/[id]/albums — reorder albums
export async function PUT(
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
  const parsed = reorderAlbumsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Update sortOrder for each album by its index
  await Promise.all(
    parsed.data.albumIds.map((albumId, index) =>
      db
        .update(albums)
        .set({ sortOrder: index })
        .where(eq(albums.id, albumId))
    )
  );

  return NextResponse.json({ success: true });
}
