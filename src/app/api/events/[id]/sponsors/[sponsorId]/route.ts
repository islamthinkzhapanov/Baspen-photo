import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sponsorBlocks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateSponsorSchema } from "@/lib/validators/sponsor";
import { requireEventRole } from "@/lib/event-auth";

// PATCH /api/events/[id]/sponsors/[sponsorId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sponsorId: string }> }
) {
  const { id, sponsorId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { denied } = await requireEventRole(id, session.user.id, "owner");
  if (denied) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSponsorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(sponsorBlocks)
    .set(parsed.data)
    .where(
      and(
        eq(sponsorBlocks.id, sponsorId),
        eq(sponsorBlocks.eventId, id)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/events/[id]/sponsors/[sponsorId]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sponsorId: string }> }
) {
  const { id, sponsorId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { denied: deleteDenied } = await requireEventRole(id, session.user.id, "owner");
  if (deleteDenied) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [deleted] = await db
    .delete(sponsorBlocks)
    .where(
      and(
        eq(sponsorBlocks.id, sponsorId),
        eq(sponsorBlocks.eventId, id)
      )
    )
    .returning({ id: sponsorBlocks.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
