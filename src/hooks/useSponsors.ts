"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateSponsorInput, UpdateSponsorInput } from "@/lib/validators/sponsor";

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useSponsors(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "sponsors"],
    queryFn: () => fetchJson(`/api/events/${eventId}/sponsors`),
    enabled: !!eventId,
  });
}

export function useCreateSponsor(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSponsorInput) =>
      fetchJson(`/api/events/${eventId}/sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["events", eventId, "sponsors"] }),
  });
}

export function useUpdateSponsor(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sponsorId,
      data,
    }: {
      sponsorId: string;
      data: UpdateSponsorInput;
    }) =>
      fetchJson(`/api/events/${eventId}/sponsors/${sponsorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["events", eventId, "sponsors"] }),
  });
}

export function useDeleteSponsor(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sponsorId: string) =>
      fetchJson(`/api/events/${eventId}/sponsors/${sponsorId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["events", eventId, "sponsors"] }),
  });
}

export function useWidget(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "widget"],
    queryFn: () => fetchJson(`/api/events/${eventId}/widget`),
    enabled: !!eventId,
  });
}

export function useSaveWidget(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customDomain?: string;
      config?: Record<string, unknown>;
    }) =>
      fetchJson(`/api/events/${eventId}/widget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["events", eventId, "widget"] }),
  });
}
