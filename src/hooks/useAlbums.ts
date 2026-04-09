"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Album {
  id: string;
  eventId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  photoCount: number;
}

export function useEventAlbums(eventId: string) {
  return useQuery<Album[]>({
    queryKey: ["events", eventId, "albums"],
    queryFn: () => fetchJson(`/api/events/${eventId}/albums`),
    enabled: !!eventId,
  });
}

export function useCreateAlbum(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) =>
      fetchJson(`/api/events/${eventId}/albums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", eventId, "albums"] });
    },
  });
}

export function useUpdateAlbum(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      albumId,
      data,
    }: {
      albumId: string;
      data: { name?: string; sortOrder?: number };
    }) =>
      fetchJson(`/api/events/${eventId}/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", eventId, "albums"] });
    },
  });
}

export function useDeleteAlbum(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (albumId: string) =>
      fetchJson(`/api/events/${eventId}/albums/${albumId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", eventId, "albums"] });
      qc.invalidateQueries({ queryKey: ["events", eventId, "photos"] });
    },
  });
}

export function useReorderAlbums(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (albumIds: string[]) =>
      fetchJson(`/api/events/${eventId}/albums`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", eventId, "albums"] });
    },
  });
}

export function useMovePhotosToAlbum(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      photoIds,
      albumId,
    }: {
      photoIds: string[];
      albumId: string | null;
    }) =>
      fetchJson(`/api/events/${eventId}/photos/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds, albumId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", eventId, "photos"] });
      qc.invalidateQueries({ queryKey: ["events", eventId, "albums"] });
    },
  });
}
