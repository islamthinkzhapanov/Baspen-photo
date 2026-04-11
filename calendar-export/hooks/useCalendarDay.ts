"use client";

import { useQuery } from "@tanstack/react-query";
import type { SpecialistDayInfo } from "@/types/calendar";
import type { Appointment } from "./useAppointments";
import { isPendingPrepayment } from "@/lib/pendingPrepayments";

export type { SpecialistDayInfo };

export interface BreakEntry {
  id: string;
  specialistId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdBy: string | null;
}

export interface CalendarDayData {
  date: string;
  calendarStep: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  specialists: SpecialistDayInfo[];
  appointments: Appointment[];
  breaks: BreakEntry[];
}

export function useCalendarDay(date: string) {
  return useQuery<CalendarDayData>({
    queryKey: ["calendar-day", date],
    queryFn: async () => {
      const res = await fetch(`/api/calendar/day?date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch calendar day");
      const raw = await res.json();
      // Map .NET API shape { schedule, appointments, breaks } to CalendarDayData
      const data: CalendarDayData = {
        date,
        calendarStep: raw.calendarStep ?? 30,
        workingHoursStart: raw.workingHoursStart ?? 9,
        workingHoursEnd: raw.workingHoursEnd ?? 21,
        specialists: (raw.specialists ?? raw.schedule ?? []).map((s: Record<string, unknown>) => ({
          ...s,
          id: s.id ?? s.specialistId,
          fullName: s.fullName ?? s.specialistName,
          position: s.position ?? s.jobTitle ?? s.specialization ?? null,
          workStart: s.workStart ?? s.startTime ?? "09:00",
          workEnd: s.workEnd ?? s.endTime ?? "21:00",
        })),
        appointments: (raw.appointments ?? []).map((a: Record<string, unknown>) => ({
          ...a,
          specialistId: a.specialistId ?? (a.specialist as Record<string, unknown>)?.id,
        })),
        breaks: (raw.breaks ?? []).map((b: Record<string, unknown>) => ({
          ...b,
          specialistId: b.specialistId ?? b.specialist_id,
        })),
      };
      // Hide appointments that are currently in the prepayment dialog
      data.appointments = data.appointments.filter((a) => !isPendingPrepayment(a.id));
      return data;
    },
    enabled: !!date,
    staleTime: 60_000,
  });
}
