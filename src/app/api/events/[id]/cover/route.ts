import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireEventRole } from "@/lib/event-auth";
import { getUploadUrl, getPublicUrl, deleteObject } from "@/lib/storage/s3";
import { withHandler } from "@/lib/api-handler";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/events/[id]/cover — get presigned upload URL
export const POST = withHandler(async function POST(
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
  const { contentType, fileName } = body as {
    contentType?: string;
    fileName?: string;
  };

  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Invalid content type. Allowed: JPEG, PNG, WebP" },
      { status: 400 }
    );
  }

  const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
  const key = `events/${id}/cover/${nanoid()}.${ext}`;
  const uploadUrl = await getUploadUrl(key, contentType);
  const publicUrl = getPublicUrl(key);

  return NextResponse.json({ uploadUrl, publicUrl, key });
});

// DELETE /api/events/[id]/cover — remove cover image
export const DELETE = withHandler(async function DELETE(
  _request: Request,
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

  // Get current cover URL to delete from S3
  const [event] = await db
    .select({ coverUrl: events.coverUrl })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (event?.coverUrl) {
    // Extract S3 key from public URL
    const publicUrlBase = process.env.S3_PUBLIC_URL || "";
    if (publicUrlBase && event.coverUrl.startsWith(publicUrlBase)) {
      const key = event.coverUrl.slice(publicUrlBase.length + 1);
      try {
        await deleteObject(key);
      } catch (err) {
        console.error("[cover] Failed to delete S3 object:", err);
      }
    }
  }

  await db
    .update(events)
    .set({ coverUrl: null, updatedAt: new Date() })
    .where(eq(events.id, id));

  return NextResponse.json({ success: true });
});
