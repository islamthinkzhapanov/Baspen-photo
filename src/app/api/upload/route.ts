import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUploadUrl } from "@/lib/storage/s3";
import { getEventAccess } from "@/lib/event-auth";
import { nanoid } from "nanoid";
import { withHandler } from "@/lib/api-handler";

// POST /api/upload — get presigned upload URLs
export const POST = withHandler(async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { eventId, files } = body as {
    eventId: string;
    files: { name: string; type: string; size: number }[];
  };

  if (!eventId || !files?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const access = await getEventAccess(eventId, session.user.id);
  if (!access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (files.length > 500) {
    return NextResponse.json(
      { error: "Max 500 files per batch" },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];
  const maxSize = 50 * 1024 * 1024; // 50MB

  const urls = await Promise.all(
    files.map(async (file) => {
      if (!allowedTypes.includes(file.type)) {
        return { name: file.name, error: "Invalid type" };
      }
      if (file.size > maxSize) {
        return { name: file.name, error: "File too large" };
      }

      const ext = file.name.split(".").pop() || "jpg";
      const key = `events/${eventId}/originals/${nanoid()}.${ext}`;

      const uploadUrl = await getUploadUrl(key, file.type);

      return {
        name: file.name,
        key,
        uploadUrl,
        type: file.type,
      };
    })
  );

  return NextResponse.json({ urls });
});
