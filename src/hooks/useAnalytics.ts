"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useEventAnalytics(
  eventId: string,
  from?: string,
  to?: string
) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return useQuery({
    queryKey: ["events", eventId, "analytics", from, to],
    queryFn: () =>
      fetchJson(`/api/events/${eventId}/analytics?${params.toString()}`),
    enabled: !!eventId,
  });
}
