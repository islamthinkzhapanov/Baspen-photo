import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventMembers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { inviteMemberSchema } from "@/lib/validators/event";
import { getEventAccess, requireEventRole } from "@/lib/event-auth";

// GET /api/events/[id]/members
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getEventAccess(id, session.user.id);
  if (!access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await db
    .select({
      id: eventMembers.id,
      role: eventMembers.role,
      invitedAt: eventMembers.invitedAt,
      acceptedAt: eventMembers.acceptedAt,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
      },
    })
    .from(eventMembers)
    .innerJoin(users, eq(eventMembers.userId, users.id))
    .where(eq(eventMembers.eventId, id));

  return NextResponse.json(members);
}

// POST /api/events/[id]/members — invite by email (owner only)
export async function POST(
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
  const parsed = inviteMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Find user by email
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Check if already member
  const existing = await db
    .select({ id: eventMembers.id })
    .from(eventMembers)
    .where(
      and(
        eq(eventMembers.eventId, id),
        eq(eventMembers.userId, user.id)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Already a member" },
      { status: 409 }
    );
  }

  const [member] = await db
    .insert(eventMembers)
    .values({
      eventId: id,
      userId: user.id,
      role: parsed.data.role,
    })
    .returning();

  return NextResponse.json(member, { status: 201 });
}
