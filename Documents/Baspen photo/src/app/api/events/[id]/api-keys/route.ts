import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys, eventMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateApiKey } from "@/lib/api-key";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/events/[id]/api-keys
 *
 * List API keys for an event (owner/photographer only).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await context.params;

  // Verify membership
  const [member] = await db
    .select({ role: eventMembers.role })
    .from(eventMembers)
    .where(
      and(
        eq(eventMembers.eventId, eventId),
        eq(eventMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      isRevoked: apiKeys.isRevoked,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(
      and(eq(apiKeys.eventId, eventId), eq(apiKeys.userId, session.user.id))
    )
    .orderBy(apiKeys.createdAt);

  return NextResponse.json({ keys });
}

/**
 * POST /api/events/[id]/api-keys
 *
 * Create a new API key for camera auto-upload.
 * The raw key is returned ONCE — it cannot be retrieved again.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await context.params;

  // Verify membership (owner or photographer)
  const [member] = await db
    .select({ role: eventMembers.role })
    .from(eventMembers)
    .where(
      and(
        eq(eventMembers.eventId, eventId),
        eq(eventMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const name = (body.name as string) || "Camera API Key";

  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  const [created] = await db
    .insert(apiKeys)
    .values({
      userId: session.user.id,
      eventId,
      name,
      keyHash,
      keyPrefix,
    })
    .returning({ id: apiKeys.id, createdAt: apiKeys.createdAt });

  return NextResponse.json({
    id: created.id,
    name,
    keyPrefix,
    rawKey, // Shown once!
    createdAt: created.createdAt,
  });
}

/**
 * DELETE /api/events/[id]/api-keys?keyId=xxx
 *
 * Revoke an API key.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await context.params;
  const keyId = request.nextUrl.searchParams.get("keyId");

  if (!keyId) {
    return NextResponse.json({ error: "Missing keyId" }, { status: 400 });
  }

  await db
    .update(apiKeys)
    .set({ isRevoked: true })
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.eventId, eventId),
        eq(apiKeys.userId, session.user.id)
      )
    );

  return NextResponse.json({ success: true });
}
