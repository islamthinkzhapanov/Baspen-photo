"use client";

import { useQuery } from "@tanstack/react-query";
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
