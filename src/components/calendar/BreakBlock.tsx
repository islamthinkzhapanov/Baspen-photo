"use client";

import { cn } from "@/lib/utils";
import type { CalendarBreakEntry } from "@/hooks/useCalendarEvents";

interface BreakBlockProps {
  brk: CalendarBreakEntry;
  top: number;
  height: number;
  onClick?: () => void;
}

export function BreakBlock({ brk, top, height, onClick }: BreakBlockProps) {
  return (
    <div
      className={cn(
        "absolute left-0.5 right-0.5 bg-gray-100/70 border border-gray-200",
        "flex items-center justify-center z-[5]",
        onClick
          ? "cursor-pointer hover:bg-gray-200/70 transition-colors"
          : "pointer-events-none"
      )}
      style={{
        borderRadius: 4,
        top,
        height: Math.max(height, 20),
      }}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
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
  );
}
