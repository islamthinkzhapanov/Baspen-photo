import { db } from "@/lib/db";
import { events, eventMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type EventRole = "owner" | "photographer" | null;

interface EventAccessResult {
  hasAccess: boolean;
  role: EventRole;
  isEventOwner: boolean;
}

/**
 * Check if a user has access to an event and return their event-level role.
 *
 * A user has access if they are:
 * - The event owner (events.ownerId)
 * - A member of the event (eventMembers)
 *
 * Returns the effective event-level role:
 * - "owner" if they are the event owner OR an event member with role "owner"
 * - "photographer" if they are an event member with role "photographer"
 * - null if they have no access
 */
export async function getEventAccess(
  eventId: string,
  userId: string
): Promise<EventAccessResult> {
  // Check event membership first (covers both owner members and photographers)
  const [member] = await db
    .select({ role: eventMembers.role })
    .from(eventMembers)
    .where(
      and(eq(eventMembers.eventId, eventId), eq(eventMembers.userId, userId))
    )
    .limit(1);

  if (member) {
    return {
      hasAccess: true,
      role: member.role,
      isEventOwner: member.role === "owner",
    };
  }

  // Fallback: check if user is the event owner (ownerId) but not in eventMembers
  // This handles legacy events created before eventMembers were auto-added
  const [event] = await db
    .select({ ownerId: events.ownerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (event && event.ownerId === userId) {
    return { hasAccess: true, role: "owner", isEventOwner: true };
  }

  return { hasAccess: false, role: null, isEventOwner: false };
}

/**
 * Require a minimum role for an event action.
 * "photographer" = any member, "owner" = owner only.
 */
export async function requireEventRole(
  eventId: string,
  userId: string,
  minRole: "owner" | "photographer"
): Promise<EventAccessResult & { denied: boolean }> {
  const access = await getEventAccess(eventId, userId);

  if (!access.hasAccess) {
    return { ...access, denied: true };
  }

  if (minRole === "owner" && !access.isEventOwner) {
    return { ...access, denied: true };
  }

  return { ...access, denied: false };
}
