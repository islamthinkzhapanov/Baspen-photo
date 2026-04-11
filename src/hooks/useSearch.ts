"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { FaceSearchResult, NumberSearchResult } from "@/types/api";

export type { SearchPhoto, FaceSearchResult, NumberSearchResult } from "@/types/api";

export function useFaceSearch() {
  return useMutation({
    mutationFn: async ({
      file,
      eventId,
      sessionToken,
    }: {
      file: Blob;
      eventId: string;
      sessionToken?: string;
    }): Promise<FaceSearchResult> => {
      const formData = new FormData();
      formData.append("file", file, "selfie.jpg");
      formData.append("eventId", eventId);
      if (sessionToken) {
        formData.append("sessionToken", sessionToken);
      }

      const res = await fetch("/api/search/face", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      return res.json();
    },
  });
}

export function useNumberSearch(eventId: string, number: string) {
  return useQuery<NumberSearchResult>({
    queryKey: ["search", "number", eventId, number],
    queryFn: async () => {
      const res = await fetch(
        `/api/search/number?eventId=${eventId}&number=${encodeURIComponent(number)}`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !!eventId && !!number && number.length >= 1,
  });
}
