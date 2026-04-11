"use client";

import { useMemo } from "react";
import { format, parseISO, isToday as dateIsToday } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { timeToMinutes, minutesToTime } from "@/lib/time";
import { EventBlock } from "./EventBlock";
import { BreakBlock } from "./BreakBlock";
import type {
  CalendarWeekDay,
  CalendarEvent,
  CalendarBreakEntry,
} from "@/hooks/useCalendarEvents";

const ROW_HEIGHT = 64;
const TIME_COL_WIDTH = 56;
const MIN_DAY_COL_WIDTH = 100;

const DAY_NAMES_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

interface WeekViewProps {
  workStart: string;
  workEnd: string;
  calendarStep: number;
  days: CalendarWeekDay[];
  onSlotClick: (time: string, date: string) => void;
  onEventClick: (eventId: string) => void;
  onBreakClick?: (breakId: string) => void;
}

export function WeekView({
  workStart,
  workEnd,
  calendarStep,
  days,
  onSlotClick,
  onEventClick,
  onBreakClick,
}: WeekViewProps) {
  const workStartMin = timeToMinutes(workStart);
  const workEndMin = timeToMinutes(workEnd);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let m = workStartMin; m < workEndMin; m += calendarStep) {
      slots.push(minutesToTime(m));
    }
    return slots;
  }, [workStartMin, workEndMin, calendarStep]);

  const totalGridHeight = timeSlots.length * ROW_HEIGHT;

  function toTop(time: string): number {
    const min = timeToMinutes(time) - workStartMin;
    return (min / calendarStep) * ROW_HEIGHT;
  }

  function toHeight(startTime: string, endTime: string): number {
    const dur = timeToMinutes(endTime) - timeToMinutes(startTime);
    return (dur / calendarStep) * ROW_HEIGHT;
  }

  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Нет данных
      </div>
    );
  }

  const totalMinWidth = TIME_COL_WIDTH + days.length * MIN_DAY_COL_WIDTH;

  return (
    <div className="flex-1 overflow-auto">
      <div style={{ minWidth: totalMinWidth }}>
        {/* ─── Sticky header: day names + dates ──────────────────────────── */}
        <div
          className="flex shrink-0 border-b border-gray-200 bg-white sticky top-0 z-20"
          style={{ paddingLeft: TIME_COL_WIDTH }}
        >
          {days.map((day) => {
            const dateObj = parseISO(day.date);
            const dayName = DAY_NAMES_SHORT[dateObj.getDay()];
            const dayNum = format(dateObj, "d");
            const monthName = format(dateObj, "MMM", { locale: ru });
            const isToday = dateIsToday(dateObj);
            const isSunday = dateObj.getDay() === 0;
            const isSaturday = dateObj.getDay() === 6;
            const isWeekend = isSunday || isSaturday;

            return (
              <div
                key={day.date}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1.5 border-l border-gray-200",
                  "sm:py-2",
                  isWeekend && "bg-gray-50",
                )}
                style={{ minWidth: MIN_DAY_COL_WIDTH }}
              >
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium uppercase tracking-wide",
                    isToday ? "text-gray-900 font-semibold" : "text-gray-500",
                  )}
                >
                  {dayName}
                </span>
                <span
                  className={cn(
                    "text-sm sm:text-base font-semibold leading-tight",
                    isToday
                      ? "text-gray-900"
                      : isWeekend
                        ? "text-gray-400"
                        : "text-gray-900",
                  )}
                >
                  {dayNum}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 capitalize">
                  {monthName}
                </span>
              </div>
            );
          })}
        </div>

        {/* ─── Grid body ─────────────────────────────────────────────────── */}
        <div className="flex" style={{ minHeight: totalGridHeight }}>
          {/* Time labels column — sticky left */}
          <div
            className="shrink-0 sticky left-0 z-10 bg-white border-r border-gray-200"
            style={{ width: TIME_COL_WIDTH }}
          >
            {timeSlots.map((slot, idx) => (
              <div
                key={slot}
                className="flex items-start pt-1 pr-2 select-none"
                style={{ height: ROW_HEIGHT }}
              >
                {idx > 0 && (
                  <span className="text-xs text-gray-400 ml-auto leading-none">
                    {slot}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateObj = parseISO(day.date);
            const isToday = dateIsToday(dateObj);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

            return (
              <div
                key={day.date}
                className="flex-1 relative border-l border-gray-200"
                style={{ minWidth: MIN_DAY_COL_WIDTH, height: totalGridHeight }}
              >
                {/* Clickable time slot rows */}
                {timeSlots.map((slot) => (
                  <div
                    key={slot}
                    className="absolute left-0 right-0 border-b border-gray-100 hover:bg-green-200 transition-colors cursor-pointer"
                    style={{ top: toTop(slot), height: ROW_HEIGHT }}
                    onClick={() => onSlotClick(slot, day.date)}
                  />
                ))}

                {/* Weekend overlay */}
                {isWeekend && (
                  <div className="absolute inset-0 bg-gray-50/50 pointer-events-none" />
                )}

                {/* Today highlight */}
                {isToday && (
                  <div className="absolute inset-0 bg-gray-50/40 pointer-events-none" />
                )}

                {/* Breaks */}
                {day.breaks.map((brk: CalendarBreakEntry) => (
                  <BreakBlock
                    key={brk.id}
                    brk={brk}
                    top={toTop(brk.startTime)}
                    height={Math.max(toHeight(brk.startTime, brk.endTime), 20)}
                    onClick={onBreakClick ? () => onBreakClick(brk.id) : undefined}
                  />
                ))}

                {/* Events */}
                {day.events.map((evt: CalendarEvent) => {
                  const endTime =
                    evt.endTime ??
                    minutesToTime(timeToMinutes(evt.startTime) + 120);
                  return (
                    <EventBlock
                      key={evt.id}
                      event={evt}
                      top={toTop(evt.startTime)}
                      height={toHeight(evt.startTime, endTime)}
                      compact
                      onClick={() => onEventClick(evt.id)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
