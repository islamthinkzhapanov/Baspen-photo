"use client";

import { useEvent } from "./useEvents";

type EventRole = "owner" | "photographer";

/**
 * Returns the current user's event-level role for a specific event.
 * Uses the `currentUserRole` field returned by GET /api/events/[id].
 */
export function useEventRole(eventId: string) {
  const { data, isLoading } = useEvent(eventId);

  const role = (data?.currentUserRole as EventRole | undefined) ?? null;

  return {
    role,
    isLoading,
    isEventOwner: role === "owner",
    isEventPhotographer: role === "photographer",
    hasAccess: role !== null,
  };
}
