import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inviteTokens, users } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { acceptInviteSchema } from "@/lib/validators/invite";
import { withHandler } from "@/lib/api-handler";

// POST /api/invite/accept — set password + activate user (public)
export const POST = withHandler(async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = acceptInviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  // Find valid token
  const [invite] = await db
    .select({
      id: inviteTokens.id,
      userId: inviteTokens.userId,
    })
    .from(inviteTokens)
    .where(
      and(
        eq(inviteTokens.token, token),
        isNull(inviteTokens.usedAt),
        gt(inviteTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invite) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 404 }
    );
  }

  // Hash password and activate user
  const passwordHash = await bcrypt.hash(password, 12);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        status: "active",
        emailVerified: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, invite.userId));

    await tx
      .update(inviteTokens)
      .set({ usedAt: new Date() })
      .where(eq(inviteTokens.id, invite.id));
  });

  return NextResponse.json({ success: true });
});
