import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { users, events, userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { eq, desc, like, count, sql } from "drizzle-orm";

// GET /api/admin/users — list all users with pagination
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${users.email} ILIKE ${"%" + search + "%"} OR ${users.name} ILIKE ${"%" + search + "%"})`
    );
  }
  if (role) {
    conditions.push(eq(users.role, role as "super_admin" | "user"));
  }

  const whereClause = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : undefined;

  const [allUsers, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        image: users.image,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(users)
      .where(whereClause),
  ]);

  // Get event counts per user
  const userIds = allUsers.map((u) => u.id);
  const eventCounts = userIds.length > 0
    ? await db
        .select({
          ownerId: events.ownerId,
          count: count(),
        })
        .from(events)
        .where(sql`${events.ownerId} IN ${userIds}`)
        .groupBy(events.ownerId)
    : [];

  const eventCountMap = new Map(eventCounts.map((e) => [e.ownerId, e.count]));

  const enrichedUsers = allUsers.map((u) => ({
    ...u,
    eventCount: eventCountMap.get(u.id) || 0,
  }));

  return NextResponse.json({
    users: enrichedUsers,
    total: totalResult[0]?.total || 0,
    page,
    limit,
  });
}

// PATCH /api/admin/users — update user role
export async function PATCH(request: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role required" }, { status: 400 });
  }

  const validRoles = ["super_admin", "user"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Prevent self-demotion
  if (userId === session!.user.id && role !== "super_admin") {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
