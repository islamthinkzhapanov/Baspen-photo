import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inviteTokens, users } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

// GET /api/invite/validate?token=xxx — check if invite token is valid (public)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const [invite] = await db
    .select({
      id: inviteTokens.id,
      userId: inviteTokens.userId,
      expiresAt: inviteTokens.expiresAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(inviteTokens)
    .innerJoin(users, eq(inviteTokens.userId, users.id))
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
      { valid: false, error: "Invalid or expired token" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    valid: true,
    name: invite.userName,
    email: invite.userEmail,
  });
}
