import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  occupation: z.string().min(1),
});

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

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone,
      occupation: parsed.data.occupation,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
