"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateBreakInput, UpdateBreakInput } from "@/lib/validators/break";

export interface BreakData {
  id: string;
  tenantId: string;
  specialistId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

function invalidateCalendar(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["calendar-day"] });
  queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
  queryClient.invalidateQueries({ queryKey: ["availability"] });
}

export function useCreateBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBreakInput) => {
      const res = await fetch("/api/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : err.message ?? "Ошибка");
      }
      return res.json() as Promise<BreakData>;
    },
    onSuccess: () => invalidateCalendar(queryClient),
  });
}

export function useUpdateBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBreakInput }) => {
      const res = await fetch(`/api/breaks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : err.message ?? "Ошибка");
      }
      return res.json() as Promise<BreakData>;
    },
    onSuccess: () => invalidateCalendar(queryClient),
  });
}

export function useDeleteBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/breaks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : err.message ?? "Ошибка");
      }
    },
    onSuccess: () => invalidateCalendar(queryClient),
  });
}
