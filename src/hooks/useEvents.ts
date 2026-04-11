"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validators/event";
import type { Event, EventMember } from "@/types/api";

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: () => fetchJson("/api/events"),
  });
}

export function useEvent(id: string) {
  return useQuery<Event>({
    queryKey: ["events", id],
    queryFn: () => fetchJson(`/api/events/${id}`),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventInput) =>
      fetchJson<{ id: string }>("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEventInput) =>
      fetchJson<any>(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["events", id] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/events/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useEventMembers(eventId: string) {
  return useQuery<EventMember[]>({
    queryKey: ["events", eventId, "members"],
    queryFn: () => fetchJson(`/api/events/${eventId}/members`),
    enabled: !!eventId,
  });
}

export function useInviteMember(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      fetchJson(`/api/events/${eventId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["events", eventId, "members"] }),
  });
}
