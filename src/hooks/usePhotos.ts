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

export function useUploadPhotos(
  eventId: string,
  onProgress?: (done: number, total: number) => void
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const BATCH_SIZE = 50;
      const CONCURRENT_UPLOADS = 5;
      const allResults: PromiseSettledResult<unknown>[] = [];
      let completed = 0;

      onProgress?.(0, files.length);

      // Process files in batches of BATCH_SIZE for presigned URLs
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        // 1. Get presigned URLs for this batch
        const { urls } = await fetchJson("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            files: batch.map((f) => ({
              name: f.name,
              type: f.type,
              size: f.size,
            })),
          }),
        });

        // 2. Upload to S3 + register, with concurrency limit
        const uploadOne = async (
          urlInfo: {
            uploadUrl?: string;
            key?: string;
            name: string;
            type?: string;
            error?: string;
          },
          fileIdx: number
        ) => {
          if (urlInfo.error) throw new Error(urlInfo.error);

          await fetch(urlInfo.uploadUrl!, {
            method: "PUT",
            body: batch[fileIdx],
            headers: { "Content-Type": urlInfo.type! },
          });

          const result = await fetchJson(`/api/events/${eventId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storagePath: urlInfo.key,
              originalFilename: urlInfo.name,
              mimeType: urlInfo.type,
              fileSize: batch[fileIdx].size,
            }),
          });

          completed++;
          onProgress?.(completed, files.length);
          return result;
        };

        // Upload with concurrency limit
        for (let j = 0; j < urls.length; j += CONCURRENT_UPLOADS) {
          const chunk = urls.slice(j, j + CONCURRENT_UPLOADS);
          const results = await Promise.allSettled(
            chunk.map((urlInfo: { uploadUrl?: string; key?: string; name: string; type?: string; error?: string }, idx: number) =>
              uploadOne(urlInfo, j + idx)
            )
          );
          allResults.push(...results);
        }
      }

      return allResults;
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

export function useBulkDeletePhotos(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { photoIds?: string[]; all?: boolean }) => {
      const res = await fetch(`/api/events/${eventId}/photos/bulk-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", eventId, "photos"] });
      qc.invalidateQueries({ queryKey: ["events", eventId] });
      qc.invalidateQueries({ queryKey: ["events"] });
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
