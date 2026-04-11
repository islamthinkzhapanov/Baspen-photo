import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { withHandler } from "@/lib/api-handler";

const schema = z.object({
  email: z.string().email(),
  locale: z.string().optional(),
});

// POST /api/auth/forgot-password — send reset link
export const POST = withHandler(async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email" },
      { status: 400 }
    );
  }

  const { email, locale } = parsed.data;

  // Rate limit by email: 3 requests per 15 minutes
  const { allowed, retryAfter } = await rateLimit(`rl:forgot:${email.toLowerCase()}`, 3, 900);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
      { status: 429 }
    );
  }

  // Always return success to prevent email enumeration
  const successResponse = NextResponse.json({ success: true });

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return successResponse;
  }

  // Generate token (1 hour expiry)
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  try {
    await sendPasswordResetEmail({ to: email, token, locale });
  } catch {
    // Log but don't reveal to user
    console.error("Failed to send password reset email to", email);
  }

  return successResponse;
});
