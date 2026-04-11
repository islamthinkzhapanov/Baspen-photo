"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  format,
  addDays,
  subDays,
  parseISO,
  isToday as dateIsToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiAddLine,
  RiLoader4Line,
  RiCalendarLine,
} from "@remixicon/react";
import { useCalendarThreeDays } from "@/hooks/useCalendarEvents";
import type { CalendarBreakEntry } from "@/hooks/useCalendarEvents";
import { ThreeDayView } from "./ThreeDayView";
import { BreakSheet, type BreakSheetState } from "./BreakSheet";
import { CreateProjectModal } from "@/components/event/CreateProjectModal";

function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/* ─── Mini calendar popover ───────────────────────────────────────────────── */

function MiniCalendar({
  selected,
  onSelect,
  onClose,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(startOfMonth(selected));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-3 w-[280px]"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <RiArrowLeftSLine className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900 capitalize">
          {format(month, "LLLL yyyy", { locale: ru })}
        </span>
        <button
          type="button"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <RiArrowRightSLine className="w-4 h-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((dn) => (
          <div key={dn} className="text-center text-[11px] font-medium text-gray-400 py-1">
            {dn}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {allDays.map((day) => {
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isSelected = isSameDay(day, selected);
          const isToday = dateIsToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                onSelect(day);
                onClose();
              }}
              className={cn(
                "w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors",
                !isCurrentMonth && "text-gray-300",
                isCurrentMonth && !isSelected && "text-gray-700 hover:bg-gray-100",
                isSelected && "bg-gray-900 text-white font-medium",
                isToday && !isSelected && "font-semibold text-gray-900 ring-1 ring-gray-900",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      <button
        type="button"
        onClick={() => {
          onSelect(new Date());
          onClose();
        }}
        className="mt-2 w-full py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Сегодня
      </button>
    </div>
  );
}

/* ─── Main CalendarPage ───────────────────────────────────────────────────── */

export function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("calendar");
  const tc = useTranslations("common");

  const [date, setDate] = useState<string>(() => {
    const d = searchParams.get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayStr();
  });

  useEffect(() => {
    const d = searchParams.get("date");
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) setDate(d);
  }, [searchParams]);

  const navigateTo = useCallback((newDate: string) => {
    setDate(newDate);
  }, []);

  // Date picker popover
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Create project modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{
    date?: Date;
    time?: string;
  }>({});

  // Break sheet
  const [breakState, setBreakState] = useState<BreakSheetState>({ open: false });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const threeDayQuery = useCalendarThreeDays(date);

  // ── Navigation ─────────────────────────────────────────────────────────────

  function toPrev() {
    navigateTo(format(subDays(parseISO(date), 3), "yyyy-MM-dd"));
  }

  function toNext() {
    navigateTo(format(addDays(parseISO(date), 3), "yyyy-MM-dd"));
  }

  // ── Click handlers ─────────────────────────────────────────────────────────

  function handleSlotClick(time: string, slotDate?: string) {
    const d = slotDate ?? date;
    setCreateDefaults({ date: parseISO(d), time });
    setCreateOpen(true);
  }

  function handleEventClick(eventId: string) {
    router.push(`/events/${eventId}?from=calendar`);
  }

  function handleBreakClick(breakId: string) {
    if (!threeDayQuery.data) return;
    let found: CalendarBreakEntry | undefined;
    let breakDate = date;

    for (const day of threeDayQuery.data.days) {
      const b = day.breaks.find((br) => br.id === breakId);
      if (b) {
        found = b;
        breakDate = day.date;
        break;
      }
    }

    if (found) {
      setBreakState({ open: true, mode: "edit", brk: found, date: breakDate });
    }
  }

  function handleNewProject() {
    setCreateDefaults({ date: parseISO(date) });
    setCreateOpen(true);
  }

  // ── Date labels ────────────────────────────────────────────────────────────

  const dateLabel = (() => {
    try {
      const d = parseISO(date);
      const end = addDays(d, 2);
      const sameMonth = d.getMonth() === end.getMonth();
      if (sameMonth) {
        return `${format(d, "d")} – ${format(end, "d MMMM yyyy", { locale: ru })}`;
      }
      return `${format(d, "d MMM", { locale: ru })} – ${format(end, "d MMM yyyy", { locale: ru })}`;
    } catch {
      return date;
    }
  })();

  const dateLabelShort = (() => {
    try {
      const d = parseISO(date);
      const end = addDays(d, 2);
      return `${format(d, "d MMM", { locale: ru })} – ${format(end, "d MMM", { locale: ru })}`;
    } catch {
      return date;
    }
  })();

  const isTodayDate = dateIsToday(parseISO(date));

  // ── Derived ────────────────────────────────────────────────────────────────

  const isLoading = threeDayQuery.isLoading;
  const isError = threeDayQuery.isError;
  const data = threeDayQuery.data;
  const calendarStep = data?.calendarStep ?? 30;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 bg-white">
      {/* ─── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-white shrink-0 sm:gap-3 sm:px-6 sm:py-3">
        {/* Left: navigation */}
        <div className="flex items-center gap-1 sm:gap-2 relative">
          <button
            type="button"
            onClick={toPrev}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <RiArrowLeftSLine className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setDatePickerOpen(!datePickerOpen)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
              isTodayDate
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
            )}
          >
            <RiCalendarLine className="w-3.5 h-3.5" />
            {t("today")}
          </button>

          {datePickerOpen && (
            <MiniCalendar
              selected={parseISO(date)}
              onSelect={(d) => navigateTo(format(d, "yyyy-MM-dd"))}
              onClose={() => setDatePickerOpen(false)}
            />
          )}

          <button
            type="button"
            onClick={toNext}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <RiArrowRightSLine className="w-4 h-4" />
          </button>

          {/* Mobile: short date */}
          <h1 className="ml-1 text-xs font-semibold text-gray-900 capitalize sm:hidden truncate max-w-[120px]" suppressHydrationWarning>
            {dateLabelShort}
          </h1>

          {/* Desktop: full date */}
          <h1 className="ml-2 text-sm font-semibold text-gray-900 capitalize hidden sm:block" suppressHydrationWarning>
            {dateLabel}
          </h1>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleNewProject}
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <RiAddLine className="w-4 h-4" />
            <span className="hidden sm:inline">{t("createProject")}</span>
          </button>
        </div>
      </div>

      {/* ─── Calendar body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading && (
          <div className="flex items-center justify-center flex-1">
            <RiLoader4Line className="w-6 h-6 text-gray-900 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-red-500">{tc("error")}</p>
          </div>
        )}

        {data && !isLoading && (
          <ThreeDayView
            days={data.days}
            workStart={data.workStart}
            workEnd={data.workEnd}
            calendarStep={data.calendarStep}
            onSlotClick={(time: string, slotDate: string) => handleSlotClick(time, slotDate)}
            onEventClick={handleEventClick}
            onBreakClick={handleBreakClick}
          />
        )}
      </div>

      {/* ─── FAB (mobile) ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleNewProject}
        className={cn(
          "fixed bottom-6 right-6 z-30 flex items-center justify-center",
          "w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg",
          "hover:bg-gray-800 active:scale-95 transition-all",
          "sm:hidden",
        )}
      >
        <RiAddLine className="w-6 h-6" />
      </button>

      {/* ─── Modals ────────────────────────────────────────────────────────── */}
      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultDate={createDefaults.date}
        defaultTime={createDefaults.time}
      />

      <BreakSheet
        state={breakState}
        calendarStep={calendarStep}
        onClose={() => setBreakState({ open: false })}
      />
    </div>
  );
}
