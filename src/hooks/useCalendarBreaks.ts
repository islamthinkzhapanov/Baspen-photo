"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { CreateBreakInput, UpdateBreakInput } from "@/lib/validators/break";

export interface BreakData {
  id: string;
  ownerId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdAt: string;
}

function invalidateCalendar(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["calendar-day"] });
  qc.invalidateQueries({ queryKey: ["calendar-week"] });
}

export function useCreateBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBreakInput) =>
      fetchJson<BreakData>("/api/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateCalendar(qc),
  });
}

export function useUpdateBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBreakInput }) =>
      fetchJson<BreakData>(`/api/breaks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateCalendar(qc),
  });
}

export function useDeleteBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/breaks/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateCalendar(qc),
  });
}
