"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  parseISO,
  isToday as dateIsToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiAddLine,
  RiLoader4Line,
} from "@remixicon/react";
import { useCalendarDay, useCalendarWeek } from "@/hooks/useCalendarEvents";
import type { CalendarBreakEntry } from "@/hooks/useCalendarEvents";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { BreakSheet, type BreakSheetState } from "./BreakSheet";
import { CreateProjectModal } from "@/components/event/CreateProjectModal";

type CalendarView = "day" | "week";

function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

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

  const navigateTo = useCallback(
    (newDate: string) => {
      setDate(newDate);
    },
    [],
  );

  const [view, setView] = useState<CalendarView>("day");

  // Create project modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{
    date?: Date;
    time?: string;
  }>({});

  // Break sheet
  const [breakState, setBreakState] = useState<BreakSheetState>({ open: false });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const dayQuery = useCalendarDay(view === "day" ? date : "");
  const weekQuery = useCalendarWeek(view === "week" ? date : "");

  // ── Navigation ─────────────────────────────────────────────────────────────

  function toPrev() {
    navigateTo(
      view === "day"
        ? format(subDays(parseISO(date), 1), "yyyy-MM-dd")
        : format(subWeeks(parseISO(date), 1), "yyyy-MM-dd"),
    );
  }

  function toNext() {
    navigateTo(
      view === "day"
        ? format(addDays(parseISO(date), 1), "yyyy-MM-dd")
        : format(addWeeks(parseISO(date), 1), "yyyy-MM-dd"),
    );
  }

  function toToday() {
    navigateTo(todayStr());
  }

  // ── Click handlers ─────────────────────────────────────────────────────────

  function handleSlotClick(time: string, slotDate?: string) {
    const d = slotDate ?? date;
    setCreateDefaults({ date: parseISO(d), time });
    setCreateOpen(true);
  }

  function handleEventClick(eventId: string) {
    router.push(`/events/${eventId}`);
  }

  function handleBreakClick(breakId: string) {
    // Find break in current data
    let found: CalendarBreakEntry | undefined;
    let breakDate = date;

    if (view === "day" && dayQuery.data) {
      found = dayQuery.data.breaks.find((b) => b.id === breakId);
      breakDate = dayQuery.data.date;
    } else if (view === "week" && weekQuery.data) {
      for (const day of weekQuery.data.days) {
        const b = day.breaks.find((br) => br.id === breakId);
        if (b) {
          found = b;
          breakDate = day.date;
          break;
        }
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

  function handleAddBreak() {
    setBreakState({ open: true, mode: "create", date });
  }

  // ── Date labels ────────────────────────────────────────────────────────────

  const dateLabel = (() => {
    try {
      const d = parseISO(date);
      if (view === "day") {
        return format(d, "EEEE, d MMMM yyyy", { locale: ru });
      }
      const wStart = startOfWeek(d, { weekStartsOn: 1 });
      const wEnd = endOfWeek(d, { weekStartsOn: 1 });
      const sameMonth = wStart.getMonth() === wEnd.getMonth();
      if (sameMonth) {
        return `${format(wStart, "d")} – ${format(wEnd, "d MMMM yyyy", { locale: ru })}`;
      }
      return `${format(wStart, "d MMM", { locale: ru })} – ${format(wEnd, "d MMM yyyy", { locale: ru })}`;
    } catch {
      return date;
    }
  })();

  const dateLabelShort = (() => {
    try {
      const d = parseISO(date);
      if (view === "day") {
        return format(d, "d MMM, EEE", { locale: ru });
      }
      const wStart = startOfWeek(d, { weekStartsOn: 1 });
      const wEnd = endOfWeek(d, { weekStartsOn: 1 });
      return `${format(wStart, "d MMM", { locale: ru })} – ${format(wEnd, "d MMM", { locale: ru })}`;
    } catch {
      return date;
    }
  })();

  const isTodayDate = dateIsToday(parseISO(date));

  // ── Derived ────────────────────────────────────────────────────────────────

  const isLoading = view === "day" ? dayQuery.isLoading : weekQuery.isLoading;
  const isError = view === "day" ? dayQuery.isError : weekQuery.isError;
  const dayData = dayQuery.data;
  const weekData = weekQuery.data;
  const calendarStep = (view === "day" ? dayData?.calendarStep : weekData?.calendarStep) ?? 30;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 bg-white">
      {/* ─── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-white shrink-0 sm:gap-3 sm:px-6 sm:py-3">
        {/* Left: navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toPrev}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <RiArrowLeftSLine className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toToday}
            className={cn(
              "px-2 py-1 rounded-lg text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
              isTodayDate
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
            )}
          >
            {t("today")}
          </button>

          <button
            type="button"
            onClick={toNext}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <RiArrowRightSLine className="w-4 h-4" />
          </button>

          {/* Mobile: short date */}
          <h1 className="ml-1 text-xs font-semibold text-gray-900 capitalize sm:hidden truncate max-w-[120px]">
            {dateLabelShort}
          </h1>

          {/* Desktop: full date */}
          <h1 className="ml-2 text-sm font-semibold text-gray-900 capitalize hidden sm:block">
            {dateLabel}
          </h1>
        </div>

        {/* Right: view switcher + actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View switcher */}
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => setView("day")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                view === "day"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {t("day")}
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                view === "week"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {t("week")}
            </button>
          </div>

          {/* Add break */}
          <button
            type="button"
            onClick={handleAddBreak}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t("addBreak")}
          </button>

          {/* New project */}
          <button
            type="button"
            onClick={handleNewProject}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
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
            <RiLoader4Line className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-red-500">{tc("error")}</p>
          </div>
        )}

        {/* Day View */}
        {view === "day" && dayData && !isLoading && (
          <DayView
            workStart={dayData.workStart}
            workEnd={dayData.workEnd}
            calendarStep={dayData.calendarStep}
            events={dayData.events}
            breaks={dayData.breaks}
            onSlotClick={(time) => handleSlotClick(time)}
            onEventClick={handleEventClick}
            onBreakClick={handleBreakClick}
            isToday={isTodayDate}
          />
        )}

        {/* Week View */}
        {view === "week" && weekData && !isLoading && (
          <WeekView
            workStart={weekData.workStart}
            workEnd={weekData.workEnd}
            calendarStep={weekData.calendarStep}
            days={weekData.days}
            onSlotClick={(time, slotDate) => handleSlotClick(time, slotDate)}
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
          "w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg",
          "hover:bg-blue-700 active:scale-95 transition-all",
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
