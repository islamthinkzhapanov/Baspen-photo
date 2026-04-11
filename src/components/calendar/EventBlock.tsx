"use client";

import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";

interface EventBlockProps {
  event: CalendarEvent;
  top: number;
  height: number;
  compact?: boolean;
  onClick: () => void;
  onDragStart?: (eventId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  suppressPointerEvents?: boolean;
}

export function EventBlock({
  event,
  top,
  height,
  compact,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
  suppressPointerEvents,
}: EventBlockProps) {
  const isPast = (() => {
    if (!event.date || !event.endTime) return false;
    const now = new Date();
    const [h, m] = event.endTime.split(":").map(Number);
    const eventEnd = new Date(event.date + "T00:00:00");
    eventEnd.setHours(h, m);
    return eventEnd < now;
  })();

  const styleClasses = isPast
    ? "bg-green-50 border-green-300 text-green-900 hover:bg-green-100"
    : "bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100";

  const dotClass = isPast ? "bg-green-500" : "bg-blue-400";

  const isVeryCompact = height < 40;

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", event.id);
        onDragStart?.(event.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute left-0.5 right-0.5 border text-left transition-colors cursor-grab active:cursor-grabbing overflow-hidden z-10",
        compact ? "pl-[14px] pr-1 py-0.5" : "pl-[14px] pr-1.5 py-1",
        isDragging && "opacity-40",
        styleClasses
      )}
      style={{
        top,
        height: Math.max(height, 24),
        borderRadius: 4,
        pointerEvents: suppressPointerEvents ? "none" : undefined,
      }}
    >
      {isVeryCompact ? (
        <span className="flex items-center gap-1 truncate text-[10px] sm:text-xs font-medium leading-none">
          <span className={cn("shrink-0 w-1.5 h-1.5 rounded-full", dotClass)} />
          <span className="truncate">{event.title}</span>
        </span>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-0.5">
            <span className={cn("shrink-0 w-1.5 h-1.5 rounded-full", dotClass)} />
            <span className="text-[10px] sm:text-xs font-semibold leading-tight truncate flex-1 min-w-0">
              {event.title}
            </span>
          </div>
          {event.location && (
            <div className="text-[10px] sm:text-xs leading-tight opacity-75 truncate">
              {event.location}
            </div>
          )}
          {height >= 80 && (
            <div className={cn(
              "leading-tight opacity-60 mt-0.5",
              compact ? "text-[10px] hidden sm:block" : "text-xs"
            )}>
              {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}
            </div>
          )}
        </>
      )}
    </button>
  );
}
