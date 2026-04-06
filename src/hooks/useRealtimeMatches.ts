"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import type { SearchPhoto } from "./useSearch";

interface UseRealtimeMatchesOptions {
  eventId: string;
  sessionToken: string | null;
  enabled?: boolean;
}

interface RealtimePhoto {
  photoId: string;
  thumbnailPath: string;
  watermarkedPath: string;
  similarity?: number;
  width: number | null;
  height: number | null;
}

/**
 * Subscribe to SSE for realtime photo match notifications.
 * Returns new photos as they arrive.
 */
export function useRealtimeMatches({
  eventId,
  sessionToken,
  enabled = true,
}: UseRealtimeMatchesOptions) {
  const [newPhotos, setNewPhotos] = useState<SearchPhoto[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const clearNewPhotos = useCallback(() => {
    setNewPhotos([]);
  }, []);

  useEffect(() => {
    if (!enabled || !eventId) return;

    const params = new URLSearchParams();
    if (sessionToken) params.set("sessionToken", sessionToken);

    const url = `/api/events/${eventId}/stream?${params.toString()}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
    });

    es.addEventListener("match", (e) => {
      const data = JSON.parse(e.data) as RealtimePhoto;
      setNewPhotos((prev) => [
        {
          id: data.photoId,
          thumbnail_path: data.thumbnailPath,
          thumbnail_avif_path: null,
          watermarked_path: data.watermarkedPath,
          placeholder: null,
          width: data.width,
          height: data.height,
          created_at: new Date().toISOString(),
          similarity: data.similarity,
        },
        ...prev,
      ]);
    });

    es.addEventListener("photo-ready", (e) => {
      const data = JSON.parse(e.data) as RealtimePhoto;
      // If no session token, show all new photos
      if (!sessionToken) {
        setNewPhotos((prev) => [
          {
            id: data.photoId,
            thumbnail_path: data.thumbnailPath,
            thumbnail_avif_path: null,
            watermarked_path: data.watermarkedPath,
            placeholder: null,
            width: data.width,
            height: data.height,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    });

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [eventId, sessionToken, enabled]);

  return { newPhotos, connected, clearNewPhotos };
}
