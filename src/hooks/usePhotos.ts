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

export function useEventPhotos(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "photos"],
    queryFn: () => fetchJson(`/api/events/${eventId}/photos`),
    enabled: !!eventId,
  });
}

export function useUploadPhotos(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      // 1. Get presigned URLs
      const { urls } = await fetchJson("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          files: files.map((f) => ({
            name: f.name,
            type: f.type,
            size: f.size,
          })),
        }),
      });

      // 2. Upload to S3 + register each photo
      const results = await Promise.allSettled(
        urls.map(
          async (
            urlInfo: {
              uploadUrl?: string;
              key?: string;
              name: string;
              type?: string;
              error?: string;
            },
            i: number
          ) => {
            if (urlInfo.error) throw new Error(urlInfo.error);

            // Upload to S3
            await fetch(urlInfo.uploadUrl!, {
              method: "PUT",
              body: files[i],
              headers: { "Content-Type": urlInfo.type! },
            });

            // Register photo in DB (BullMQ worker handles processing)
            const photo = await fetchJson(`/api/events/${eventId}/photos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                storagePath: urlInfo.key,
                originalFilename: urlInfo.name,
                mimeType: urlInfo.type,
                fileSize: files[i].size,
              }),
            });

            return photo;
          }
        )
      );

      return results;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", eventId, "photos"] });
      qc.invalidateQueries({ queryKey: ["events", eventId] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeletePhoto(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", eventId, "photos"] });
      qc.invalidateQueries({ queryKey: ["events", eventId] });
    },
  });
}

export function useProcessingStatus(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ["events", eventId, "processing-status"],
    queryFn: () => fetchJson(`/api/events/${eventId}/processing-status`),
    enabled: !!eventId && enabled,
    refetchInterval: 3000, // Poll every 3s while processing
  });
}
