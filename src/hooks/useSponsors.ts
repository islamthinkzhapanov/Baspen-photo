"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { Sponsor } from "@/types/api";
import type { CreateSponsorInput, UpdateSponsorInput } from "@/lib/validators/sponsor";

export function useSponsors(eventId: string) {
  return useQuery<Sponsor[]>({
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
    queryFn: () => fetchJson<any>(`/api/events/${eventId}/widget`),
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
