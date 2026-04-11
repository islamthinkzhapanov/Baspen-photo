"use client";

import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { fetchJson } from "@/lib/fetch";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string | null;
  location: string | null;
  coverUrl: string | null;
}

export interface CalendarBreakEntry {
  id: string;
  startTime: string;
  endTime: string;
  reason: string | null;
}

export interface CalendarDayData {
  date: string;
  workStart: string;
  workEnd: string;
  calendarStep: number;
  events: CalendarEvent[];
  breaks: CalendarBreakEntry[];
}

export interface CalendarWeekDay {
  date: string;
  dayOfWeek: number;
  events: CalendarEvent[];
  breaks: CalendarBreakEntry[];
}

export interface CalendarWeekData {
  weekStart: string;
  weekEnd: string;
  workStart: string;
  workEnd: string;
  calendarStep: number;
  days: CalendarWeekDay[];
}

export function useCalendarDay(date: string) {
  return useQuery<CalendarDayData>({
    queryKey: ["calendar-day", date],
    queryFn: () => fetchJson(`/api/calendar/day?date=${date}`),
    enabled: !!date,
    staleTime: 60_000,
  });
}

export function useCalendarWeek(date: string) {
  return useQuery<CalendarWeekData>({
    queryKey: ["calendar-week", date],
    queryFn: () => fetchJson(`/api/calendar/week?date=${date}`),
    enabled: !!date,
    staleTime: 60_000,
  });
}

export interface ThreeDayData {
  workStart: string;
  workEnd: string;
  calendarStep: number;
  days: {
    date: string;
    events: CalendarEvent[];
    breaks: CalendarBreakEntry[];
  }[];
}

export function useCalendarThreeDays(startDate: string) {
  return useQuery<ThreeDayData>({
    queryKey: ["calendar-three-days", startDate],
    queryFn: async () => {
      const d = new Date(startDate + "T00:00:00");
      const dates = [
        startDate,
        format(addDays(d, 1), "yyyy-MM-dd"),
        format(addDays(d, 2), "yyyy-MM-dd"),
      ];

      const results = await Promise.all(
        dates.map((dt) => fetchJson<CalendarDayData>(`/api/calendar/day?date=${dt}`))
      );

      return {
        workStart: results[0].workStart,
        workEnd: results[0].workEnd,
        calendarStep: results[0].calendarStep,
        days: results.map((r) => ({
          date: r.date,
          events: r.events,
          breaks: r.breaks,
        })),
      };
    },
    enabled: !!startDate,
    staleTime: 60_000,
  });
}
