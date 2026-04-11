"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { EventAnalytics } from "@/types/api";

export function useEventAnalytics(
  eventId: string,
  from?: string,
  to?: string
) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return useQuery<EventAnalytics>({
    queryKey: ["events", eventId, "analytics", from, to],
    queryFn: () =>
      fetchJson(`/api/events/${eventId}/analytics?${params.toString()}`),
    enabled: !!eventId,
  });
}
