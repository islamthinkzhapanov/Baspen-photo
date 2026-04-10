import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { s3, bucket, deleteObject } from "@/lib/storage/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const ext = file.type.split("/")[1] || "jpg";
  const key = `avatars/${session.user.id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    // Delete old avatar if exists
    const [user] = await db
      .select({ image: users.image })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user?.image) {
      const oldKey = user.image.replace(/^.*\/photos\//, "");
      if (oldKey.startsWith("avatars/")) {
        await deleteObject(oldKey).catch(() => {});
      }
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `${process.env.S3_PUBLIC_URL}/${key}`;

    await db
      .update(users)
      .set({ image: url, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ url });
  } catch (err) {
    console.error("POST /api/user/avatar error:", err);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [user] = await db
      .select({ image: users.image })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user?.image) {
      const key = user.image.replace(/^.*\/photos\//, "");
      if (key.startsWith("avatars/")) {
        await deleteObject(key).catch(() => {});
      }
    }

    await db
      .update(users)
      .set({ image: null, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/user/avatar error:", err);
    return NextResponse.json(
      { error: "Failed to delete avatar" },
      { status: 500 }
    );
  }
}
