import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1).optional(),
  occupation: z.string().min(1).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      phone: users.phone,
      occupation: users.occupation,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const setData: Record<string, unknown> = {
    name: parsed.data.name,
    updatedAt: new Date(),
  };
  if (parsed.data.phone) setData.phone = parsed.data.phone;
  if (parsed.data.occupation) setData.occupation = parsed.data.occupation;

  try {
    await db
      .update(users)
      .set(setData)
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/user/profile error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
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
    await db.delete(users).where(eq(users.id, session.user.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/user/profile error:", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
