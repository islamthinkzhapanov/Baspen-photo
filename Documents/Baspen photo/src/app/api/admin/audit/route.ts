import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

// GET /api/admin/audit — audit log with filters
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const action = searchParams.get("action") || "";
  const entityType = searchParams.get("entity_type") || "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const offset = (page - 1) * limit;

  const conditions = [];
  if (action) {
    conditions.push(
      eq(
        auditLog.action,
        action as
          | "create"
          | "update"
          | "delete"
          | "login"
          | "role_change"
          | "plan_change"
          | "payment"
      )
    );
  }
  if (entityType) {
    conditions.push(eq(auditLog.entityType, entityType));
  }
  if (from) conditions.push(gte(auditLog.createdAt, new Date(from)));
  if (to) conditions.push(lte(auditLog.createdAt, new Date(to)));

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const [entries, totalResult] = await Promise.all([
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        details: auditLog.details,
        ipAddress: auditLog.ipAddress,
        createdAt: auditLog.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(auditLog).where(whereClause),
  ]);

  return NextResponse.json({
    entries,
    total: totalResult[0]?.total || 0,
    page,
    limit,
  });
}
