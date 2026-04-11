"use client";

import { useQuery } from "@tanstack/react-query";
import type { CalendarWeekResponse } from "@/types/calendar";
import { isPendingPrepayment } from "@/lib/pendingPrepayments";

export type { CalendarWeekResponse };

export function useCalendarWeek(date: string, specialistId?: string) {
  return useQuery<CalendarWeekResponse>({
    queryKey: ["calendar-week", date, specialistId],
    queryFn: async () => {
      const params = new URLSearchParams({ date });
      if (specialistId) params.set("specialist_id", specialistId);
      const res = await fetch(`/api/calendar/week?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch calendar week");
      const data = await res.json() as CalendarWeekResponse;
      // Hide appointments that are currently in the prepayment dialog
      if (data.days) {
        data.days = data.days.map((day: any) => ({
          ...day,
          appointments: day.appointments?.filter((a: any) => !isPendingPrepayment(a.id)) ?? [],
        }));
      }
      return data;
    },
    enabled: !!date,
    staleTime: 60_000,
  });
}
