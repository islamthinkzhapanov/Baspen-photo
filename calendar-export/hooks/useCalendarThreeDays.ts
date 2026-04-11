"use client";

import { format, addDays, parseISO, isToday } from "date-fns";
import { useCalendarDay } from "./useCalendarDay";
import type { SpecialistDayInfo, BreakEntry } from "./useCalendarDay";
import type { Appointment } from "./useAppointments";

export interface ThreeDayColumn {
  date: string;
  isToday: boolean;
  specialist: SpecialistDayInfo;
  appointments: Appointment[];
  breaks: BreakEntry[];
}

export interface ThreeDayData {
  calendarStep: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  specialist: SpecialistDayInfo;
  days: ThreeDayColumn[];
}

export function useCalendarThreeDays(date: string, enabled: boolean) {
  const d = date && enabled ? parseISO(date) : null;
  const date1 = d ? date : "";
  const date2 = d ? format(addDays(d, 1), "yyyy-MM-dd") : "";
  const date3 = d ? format(addDays(d, 2), "yyyy-MM-dd") : "";

  const q1 = useCalendarDay(date1);
  const q2 = useCalendarDay(date2);
  const q3 = useCalendarDay(date3);

  const isLoading = q1.isLoading || q2.isLoading || q3.isLoading;
  const isError = q1.isError || q2.isError || q3.isError;

  let data: ThreeDayData | undefined;

  if (q1.data && q2.data && q3.data) {
    const queries = [q1.data, q2.data, q3.data];
    data = {
      calendarStep: q1.data.calendarStep,
      workingHoursStart: q1.data.workingHoursStart,
      workingHoursEnd: q1.data.workingHoursEnd,
      specialist: q1.data.specialists[0],
      days: queries.map((qd) => ({
        date: qd.date,
        isToday: isToday(parseISO(qd.date)),
        specialist: qd.specialists[0],
        appointments: qd.appointments,
        breaks: qd.breaks,
      })),
    };
  }

  return { data, isLoading, isError };
}
