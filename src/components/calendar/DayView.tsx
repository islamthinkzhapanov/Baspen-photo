"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { timeToMinutes, minutesToTime } from "@/lib/time";
import { EventBlock } from "./EventBlock";
import { BreakBlock } from "./BreakBlock";
import type { CalendarEvent, CalendarBreakEntry } from "@/hooks/useCalendarEvents";

const DEFAULT_ROW_HEIGHT = 64;
const MIN_ROW_HEIGHT = 28;
const TIME_COL_WIDTH = 56;
const EXTENDED_HOUR_END = 22;

interface DayViewProps {
  workStart: string;
  workEnd: string;
  calendarStep: number;
  events: CalendarEvent[];
  breaks: CalendarBreakEntry[];
  onSlotClick: (time: string) => void;
  onEventClick: (eventId: string) => void;
  onBreakClick?: (breakId: string) => void;
  isToday?: boolean;
}

export function DayView({
  workStart,
  workEnd,
  calendarStep,
  events,
  breaks,
  onSlotClick,
  onEventClick,
  onBreakClick,
  isToday = false,
}: DayViewProps) {
  const workStartMin = timeToMinutes(workStart);
  const workEndMin = timeToMinutes(workEnd);
  const extendedEndMin = Math.max(workEndMin, EXTENDED_HOUR_END * 60);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let m = workStartMin; m < extendedEndMin; m += calendarStep) {
      slots.push(minutesToTime(m));
    }
    return slots;
  }, [workStartMin, extendedEndMin, calendarStep]);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const compute = () => {
      const available = container.clientHeight;
      const workingSlots =
        Math.ceil((workEndMin - workStartMin) / calendarStep) + 1;
      setRowHeight(Math.max(MIN_ROW_HEIGHT, Math.floor(available / workingSlots)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    return () => ro.disconnect();
  }, [workStartMin, workEndMin, calendarStep]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!isToday || !scrollAreaRef.current) return;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const offset = ((nowMin - workStartMin) / calendarStep) * rowHeight - 100;
    if (offset > 0) {
      scrollAreaRef.current.scrollTop = offset;
    }
  }, [isToday, rowHeight, workStartMin, calendarStep]);

  // Live time indicator
  const [nowMin, setNowMin] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    };
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  function toTop(time: string): number {
    const min = timeToMinutes(time) - workStartMin;
    return (min / calendarStep) * rowHeight;
  }

  function toHeight(startTime: string, endTime: string): number {
    const dur = timeToMinutes(endTime) - timeToMinutes(startTime);
    return (dur / calendarStep) * rowHeight;
  }

  const totalGridHeight = (timeSlots.length + 1) * rowHeight;

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden flex flex-col relative">
      <div ref={scrollAreaRef} className="flex-1 overflow-auto">
        <div className="flex relative" style={{ minHeight: totalGridHeight }}>
          {/* Time labels */}
          <div
            className="shrink-0 sticky left-0 z-10 bg-white"
            style={{ width: TIME_COL_WIDTH }}
          >
            {timeSlots.map((slot) => {
              const isFullHour = slot.endsWith(":00");
              const isHovered = hoveredSlot === slot;
              return (
                <div
                  key={slot}
                  className={cn(
                    "flex items-start pt-1 justify-center select-none transition-colors",
                    isHovered ? "bg-green-100" : ""
                  )}
                  style={{ height: rowHeight }}
                >
                  <span
                    className={cn(
                      "leading-none transition-colors",
                      isFullHour ? "text-sm font-normal" : "text-xs",
                      isHovered
                        ? "text-green-700"
                        : isFullHour
                        ? "text-gray-900"
                        : "text-gray-300"
                    )}
                  >
                    {slot}
                  </span>
                </div>
              );
            })}
            <div
              className="flex items-start pt-1 justify-center select-none"
              style={{ height: rowHeight }}
            >
              <span className="text-sm font-normal text-gray-900 leading-none">
                {minutesToTime(extendedEndMin)}
              </span>
            </div>
          </div>

          {/* Main content area */}
          <div
            className="flex-1 relative border-l border-gray-200"
            style={{ minHeight: totalGridHeight }}
          >
            {/* Grid lines */}
            {timeSlots.map((slot, slotIdx) => {
              const isFullHour = slot.endsWith(":00");
              return (
                <div
                  key={`gridline-${slot}`}
                  className={cn(
                    "absolute left-0 right-0 pointer-events-none z-0",
                    slotIdx > 0 && "border-t",
                    isFullHour ? "border-gray-200" : "border-gray-100"
                  )}
                  style={{ top: toTop(slot) }}
                />
              );
            })}

            {/* Clickable slot rows */}
            {timeSlots.map((slot) => (
              <div
                key={slot}
                className="group absolute left-0 right-0 hover:bg-green-200 transition-colors cursor-pointer"
                style={{ top: toTop(slot), height: rowHeight }}
                onMouseEnter={() => setHoveredSlot(slot)}
                onMouseLeave={() => setHoveredSlot(null)}
                onClick={() => onSlotClick(slot)}
              >
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none text-green-800 text-xl font-light leading-none">
                  +
                </span>
              </div>
            ))}

            {/* Live time indicator */}
            {isToday && nowMin >= workStartMin && nowMin <= extendedEndMin && (
              <div
                className="absolute z-30 pointer-events-none flex items-center -translate-y-1/2 left-0 right-0"
                style={{
                  top: ((nowMin - workStartMin) / calendarStep) * rowHeight,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 -ml-1" />
                <div className="flex-1 h-px bg-blue-400" />
              </div>
            )}

            {/* Breaks */}
            {breaks.map((brk) => (
              <BreakBlock
                key={brk.id}
                brk={brk}
                top={toTop(brk.startTime)}
                height={toHeight(brk.startTime, brk.endTime)}
                onClick={onBreakClick ? () => onBreakClick(brk.id) : undefined}
              />
            ))}

            {/* Events */}
            {events.map((evt) => {
              const endTime = evt.endTime ?? minutesToTime(timeToMinutes(evt.startTime) + 120);
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
        </div>
      </div>
    </div>
  );
}
