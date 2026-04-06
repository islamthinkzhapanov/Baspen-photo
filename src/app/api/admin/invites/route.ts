import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { users, inviteTokens } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createInviteSchema } from "@/lib/validators/invite";
import { sendInviteEmail } from "@/lib/email";

const TOKEN_EXPIRY_HOURS = 48;

// POST /api/admin/invites — create user (status=invited) + token + send email
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, name } = parsed.data;

  // Check if user already exists
  const existing = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0 && existing[0].status === "active") {
    return NextResponse.json(
      { error: "User with this email already exists and is active" },
      { status: 409 }
    );
  }

  let userId: string;

  if (existing.length > 0) {
    // User exists but is still invited — reuse
    userId = existing[0].id;
    if (name) {
      await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, userId));
    }
  } else {
    // Create new invited user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name: name || null,
        role: "user",
        status: "invited",
      })
      .returning({ id: users.id });
    userId = newUser.id;
  }

  // Invalidate old tokens
  await db
    .update(inviteTokens)
    .set({ usedAt: new Date() })
    .where(
      sql`${inviteTokens.userId} = ${userId} AND ${inviteTokens.usedAt} IS NULL`
    );

  // Create new token
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await db.insert(inviteTokens).values({
    userId,
    token,
    expiresAt,
  });

  // Send email
  await sendInviteEmail({ to: email.toLowerCase(), name, token });

  return NextResponse.json({ success: true, userId }, { status: 201 });
}

// PATCH /api/admin/invites — resend invite (regenerate token + resend email)
export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.status !== "invited") {
    return NextResponse.json({ error: "User is already active" }, { status: 400 });
  }

  // Invalidate old tokens
  await db
    .update(inviteTokens)
    .set({ usedAt: new Date() })
    .where(
      sql`${inviteTokens.userId} = ${userId} AND ${inviteTokens.usedAt} IS NULL`
    );

  // Create new token
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await db.insert(inviteTokens).values({
    userId,
    token,
    expiresAt,
  });

  // Send email
  await sendInviteEmail({ to: user.email, name: user.name, token });

  return NextResponse.json({ success: true });
}
