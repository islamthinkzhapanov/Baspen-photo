"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { timeToMinutes, minutesToTime } from "@/lib/time";
import { AppointmentBlock } from "./AppointmentBlock";
import type { CalendarWeekResponse } from "@/hooks/useCalendarWeek";

/** Pixel height of one calendar step row */
const ROW_HEIGHT = 64;
/** Width of the left time column in px */
const TIME_COL_WIDTH = 56;
/** Minimum width for each day column (compact for mobile, flex-1 expands on desktop) */
const MIN_DAY_COL_WIDTH = 100;

const DAY_NAMES_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

interface WeekViewProps {
  data: CalendarWeekResponse;
  onSlotClick: (time: string, specialistId: string, date: string) => void;
  onAppointmentClick: (appointmentId: string) => void;
  onBreakClick?: (breakId: string) => void;
}

export function WeekView({ data, onSlotClick, onAppointmentClick, onBreakClick }: WeekViewProps) {
  const { calendarStep, workingHoursStart, workingHoursEnd, days } = data;

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let m = workingHoursStart * 60; m < workingHoursEnd * 60; m += calendarStep) {
      slots.push(minutesToTime(m));
    }
    return slots;
  }, [workingHoursStart, workingHoursEnd, calendarStep]);

  const workStartMin = workingHoursStart * 60;
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
        Нет данных для отображения
      </div>
    );
  }

  const specialistId = data.specialist.id;
  const totalMinWidth = TIME_COL_WIDTH + days.length * MIN_DAY_COL_WIDTH;

  return (
    <div className="flex-1 overflow-auto">
      {/* Inner container — min-width forces horizontal scroll on small screens */}
      <div style={{ minWidth: totalMinWidth }}>
        {/* ─── Sticky header: day names + dates ──────────────────────────────── */}
        <div
          className="flex shrink-0 border-b border-gray-200 bg-white sticky top-0 z-20"
          style={{ paddingLeft: TIME_COL_WIDTH }}
        >
          {days.map((day) => {
            const dateObj = parseISO(day.date);
            const dayName = DAY_NAMES_SHORT[day.dayOfWeek];
            const dayNum = format(dateObj, "d");
            const monthName = format(dateObj, "MMM", { locale: ru });
            const isToday = day.date === new Date().toISOString().slice(0, 10);

            return (
              <div
                key={day.date}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1.5 border-l border-gray-200",
                  "sm:py-2",
                  !day.isWorking && "bg-gray-50"
                )}
                style={{ minWidth: MIN_DAY_COL_WIDTH }}
              >
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium uppercase tracking-wide",
                    isToday ? "text-blue-600" : "text-gray-500"
                  )}
                >
                  {dayName}
                </span>
                <span
                  className={cn(
                    "text-sm sm:text-base font-semibold leading-tight",
                    isToday
                      ? "text-blue-600"
                      : day.isWorking
                      ? "text-gray-900"
                      : "text-gray-400"
                  )}
                >
                  {dayNum}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 capitalize">{monthName}</span>
                {!day.isWorking && (
                  <span className="text-[10px] text-gray-400 font-normal hidden sm:block">
                    выходной
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Grid body ───────────────────────────────────────────────────── */}
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
                  <span className="text-xs text-gray-400 ml-auto leading-none">{slot}</span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const beforeWorkMin = day.isWorking
              ? Math.max(0, timeToMinutes(day.workStart) - workStartMin)
              : null;
            const beforeWorkHeight =
              beforeWorkMin !== null
                ? (beforeWorkMin / calendarStep) * ROW_HEIGHT
                : null;

            const afterWorkMin = day.isWorking
              ? Math.max(0, workingHoursEnd * 60 - timeToMinutes(day.workEnd))
              : null;
            const afterWorkHeight =
              afterWorkMin !== null
                ? (afterWorkMin / calendarStep) * ROW_HEIGHT
                : null;

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
                    className="absolute left-0 right-0 border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer"
                    style={{ top: toTop(slot), height: ROW_HEIGHT }}
                    onClick={() =>
                      day.isWorking && onSlotClick(slot, specialistId, day.date)
                    }
                  />
                ))}

                {/* Non-working: full day overlay */}
                {!day.isWorking && (
                  <div className="absolute inset-0 bg-gray-100/70 pointer-events-none" />
                )}

                {/* Non-working: before work hours */}
                {day.isWorking &&
                  beforeWorkHeight !== null &&
                  beforeWorkHeight > 0 && (
                    <div
                      className="absolute left-0 right-0 top-0 bg-gray-50/80 border-b border-gray-200/60 pointer-events-none"
                      style={{ height: beforeWorkHeight }}
                    />
                  )}

                {/* Non-working: after work hours */}
                {day.isWorking &&
                  afterWorkHeight !== null &&
                  afterWorkHeight > 0 && (
                    <div
                      className="absolute left-0 right-0 bottom-0 bg-gray-50/80 border-t border-gray-200/60 pointer-events-none"
                      style={{ height: afterWorkHeight }}
                    />
                  )}

                {/* Template break */}
                {day.isWorking && day.breakStart && day.breakEnd && (
                  <div
                    className={cn(
                      "absolute left-0.5 right-0.5 rounded bg-gray-100/70 border border-gray-200",
                      "flex items-center justify-center pointer-events-none z-[5]"
                    )}
                    style={{
                      top: toTop(day.breakStart),
                      height: Math.max(toHeight(day.breakStart, day.breakEnd), 20),
                    }}
                  >
                    <span className="text-xs text-gray-500 font-medium">Перерыв</span>
                  </div>
                )}

                {/* Manual breaks */}
                {day.breaks.map(
                  (brk: { id: string; startTime: string; endTime: string; reason: string | null }) => (
                    <div
                      key={brk.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded bg-gray-100/70 border border-gray-200",
                        "flex items-center justify-center z-[5]",
                        onBreakClick ? "cursor-pointer hover:bg-gray-200/70 transition-colors" : "pointer-events-none"
                      )}
                      style={{
                        top: toTop(brk.startTime),
                        height: Math.max(toHeight(brk.startTime, brk.endTime), 20),
                      }}
                      onClick={(e) => {
                        if (onBreakClick) {
                          e.stopPropagation();
                          onBreakClick(brk.id);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center justify-center px-1 overflow-hidden">
                        <span className="text-xs text-gray-500 font-medium truncate w-full text-center">
                          Закрытое время
                        </span>
                        {brk.reason && (
                          <span className="text-[10px] text-gray-400 truncate w-full text-center">
                            {brk.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Appointments */}
                {(day.appointments as import("@/hooks/useAppointments").Appointment[]).map(
                  (appt) => (
                    <AppointmentBlock
                      key={appt.id}
                      appointment={appt}
                      top={toTop(appt.startTime)}
                      height={toHeight(appt.startTime, appt.endTime)}
                      compact
                      onClick={() => onAppointmentClick(appt.id)}
                    />
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
