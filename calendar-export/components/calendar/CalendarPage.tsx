"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Loader2, ChevronDown } from "lucide-react";
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  parseISO,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCalendarDay } from "@/hooks/useCalendarDay";
import { useCalendarWeek } from "@/hooks/useCalendarWeek";
import { useCalendarThreeDays } from "@/hooks/useCalendarThreeDays";
import { usePermissions } from "@/hooks/usePermissions";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { AppointmentSheet, type AppointmentSheetState } from "./AppointmentSheet";

type CalendarView = "day" | "week";

/** Returns "YYYY-MM-DD" for today in local time */
function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [date, setDate] = useState<string>(() => {
    const d = searchParams.get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayStr();
  });

  // Sync date when URL param changes (e.g. from sidebar mini-calendar)
  useEffect(() => {
    const d = searchParams.get("date");
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) setDate(d);
  }, [searchParams]);

  // Navigate to a date: update state AND URL so sidebar stays in sync
  const navigateTo = useCallback((newDate: string) => {
    setDate(newDate);
    router.replace(`?date=${newDate}`, { scroll: false });
  }, [router]);
  const [view, setView] = useState<CalendarView>("day");
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string | undefined>(undefined);
  const [specialistMenuOpen, setSpecialistMenuOpen] = useState(false);

  const { isSpecialist } = usePermissions();

  const [sheet, setSheet] = useState<AppointmentSheetState>({
    open: false,
    mode: "create",
  });

  // ── Data fetching ────────────────────────────────────────────────────────────

  const dayQuery = useCalendarDay(view === "day" ? date : "");
  const weekQuery = useCalendarWeek(
    view === "week" ? date : "",
    view === "week" ? selectedSpecialistId : undefined
  );

  // 3-day mode: when day view has a single specialist, show 3 consecutive days
  const isSingleSpecialist = view === "day" && (dayQuery.data?.specialists.length === 1);
  const threeDayQuery = useCalendarThreeDays(date, isSingleSpecialist);

  // Auto-select first specialist when week data loads for the first time
  useEffect(() => {
    if (
      view === "week" &&
      !selectedSpecialistId &&
      weekQuery.data?.specialist?.id
    ) {
      setSelectedSpecialistId(weekQuery.data.specialist.id);
    }
  }, [view, selectedSpecialistId, weekQuery.data]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  function toPrev() {
    navigateTo(
      view === "day"
        ? format(subDays(parseISO(date), 1), "yyyy-MM-dd")
        : format(subWeeks(parseISO(date), 1), "yyyy-MM-dd")
    );
  }

  function toNext() {
    navigateTo(
      view === "day"
        ? format(addDays(parseISO(date), 1), "yyyy-MM-dd")
        : format(addWeeks(parseISO(date), 1), "yyyy-MM-dd")
    );
  }

  function toToday() {
    navigateTo(todayStr());
  }

  // ── Click handlers ────────────────────────────────────────────────────────────

  function handleSlotClick(time: string, specialistId: string, slotDate?: string) {
    setSheet({
      open: true,
      mode: "create",
      prefilledTime: time,
      prefilledSpecialistId: specialistId,
      prefilledDate: slotDate ?? date,
    });
  }

  function handleAppointmentClick(appointmentId: string) {
    setSheet({ open: true, mode: "view", appointmentId });
  }

  function handleBreakClick(breakId: string) {
    setSheet({ open: true, mode: "view", breakId });
  }

  function handleNewAppointment() {
    setSheet({ open: true, mode: "create", prefilledDate: date });
  }

  // ── Date labels ────────────────────────────────────────────────────────────────

  // Full label for desktop
  const dateLabel = (() => {
    try {
      const d = parseISO(date);
      if (view === "day") {
        if (isSingleSpecialist) {
          const d3 = addDays(d, 2);
          const sameMonth = d.getMonth() === d3.getMonth();
          if (sameMonth) {
            return `${format(d, "d")} – ${format(d3, "d MMMM yyyy", { locale: ru })}`;
          }
          return `${format(d, "d MMM", { locale: ru })} – ${format(d3, "d MMM yyyy", { locale: ru })}`;
        }
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

  // Short label for mobile
  const dateLabelShort = (() => {
    try {
      const d = parseISO(date);
      if (view === "day") {
        if (isSingleSpecialist) {
          const d3 = addDays(d, 2);
          return `${format(d, "d MMM", { locale: ru })} – ${format(d3, "d MMM", { locale: ru })}`;
        }
        return format(d, "d MMM, EEE", { locale: ru });
      }
      const wStart = startOfWeek(d, { weekStartsOn: 1 });
      const wEnd = endOfWeek(d, { weekStartsOn: 1 });
      return `${format(wStart, "d MMM", { locale: ru })} – ${format(wEnd, "d MMM", { locale: ru })}`;
    } catch {
      return date;
    }
  })();

  const isTodayDate = isToday(parseISO(date));

  // ── Derived ──────────────────────────────────────────────────────────────────

  const dayData = dayQuery.data;
  const weekData = weekQuery.data;
  const threeDayData = threeDayQuery.data;
  const isLoading = view === "day"
    ? dayQuery.isLoading || (isSingleSpecialist && threeDayQuery.isLoading)
    : weekQuery.isLoading;
  const isError = view === "day" ? dayQuery.isError : weekQuery.isError;

  // Specialists list for selector (from week data or day data)
  const specialistOptions = weekData?.specialists ?? [];
  const selectedSpecialistName =
    weekData?.specialist?.fullName ?? specialistOptions[0]?.fullName;

  return (
    <div className="flex flex-col h-full -m-6 bg-white">
      {/* ─── Toolbar ──────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-white shrink-0 sm:gap-3 sm:px-6 sm:py-3">
        {/* Left: navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toPrev}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label={view === "day" ? "Предыдущий день" : "Предыдущая неделя"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toToday}
            className={cn(
              "px-2 py-1 rounded-lg text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
              isTodayDate
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            )}
          >
            Сегодня
          </button>

          <button
            type="button"
            onClick={toNext}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label={view === "day" ? "Следующий день" : "Следующая неделя"}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Mobile: short date label */}
          <h1 className="ml-1 text-xs font-semibold text-gray-900 capitalize sm:hidden truncate max-w-[120px]">
            {dateLabelShort}
          </h1>

          {/* Desktop: full date label */}
          <h1 className="ml-2 text-sm font-semibold text-gray-900 capitalize hidden sm:block">
            {dateLabel}
          </h1>
        </div>

        {/* Center: specialist selector (week view, owner/admin only) */}
        {view === "week" && !isSpecialist && specialistOptions.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setSpecialistMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition-colors sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
            >
              <span className="max-w-[100px] sm:max-w-[160px] truncate">{selectedSpecialistName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>
            {specialistMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSpecialistMenuOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
                  {specialistOptions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpecialistId(s.id);
                        setSpecialistMenuOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                        selectedSpecialistId === s.id
                          ? "text-blue-700 font-medium bg-blue-50"
                          : "text-gray-700"
                      )}
                    >
                      {s.fullName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: view switcher + new appointment (desktop only) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleNewAppointment}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Создать запись</span>
          </button>
        </div>
      </div>

      {/* ─── Calendar body ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading && (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-red-500">Ошибка загрузки данных</p>
          </div>
        )}

        {/* Day View */}
        {view === "day" && dayData && !isLoading && (
          <DayView
            calendarStep={dayData.calendarStep}
            workingHoursStart={dayData.workingHoursStart}
            workingHoursEnd={dayData.workingHoursEnd}
            specialists={dayData.specialists}
            appointments={dayData.appointments}
            breaks={dayData.breaks}
            onSlotClick={(time, specialistId, slotDate) => handleSlotClick(time, specialistId, slotDate)}
            onAppointmentClick={handleAppointmentClick}
            onBreakClick={handleBreakClick}
            isToday={isTodayDate}
            threeDayData={threeDayData}
          />
        )}

        {/* Week View */}
        {view === "week" && weekData && !isLoading && (
          <WeekView
            data={weekData}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
            onBreakClick={handleBreakClick}
          />
        )}
      </div>

      {/* ─── Floating Action Button (mobile only) ──────────────────────────── */}
      <button
        type="button"
        onClick={handleNewAppointment}
        className={cn(
          "fixed bottom-6 right-6 z-30 flex items-center justify-center",
          "w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg",
          "hover:bg-blue-700 active:scale-95 transition-all",
          "sm:hidden"
        )}
        aria-label="Новая запись"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ─── Appointment sheet ────────────────────────────────────────────────── */}
      {(dayData || weekData) && (
        <AppointmentSheet
          {...sheet}
          onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
          appointments={
            view === "day"
              ? (threeDayData
                  ? threeDayData.days.flatMap((d) => d.appointments)
                  : (dayData?.appointments ?? []))
              : (weekData?.days.flatMap((d) => d.appointments) ?? [])
          }
          specialists={
            view === "day"
              ? (dayData?.specialists ?? [])
              : weekData
              ? weekData.specialists.map((s) => ({
                  id: s.id,
                  fullName: s.fullName,
                  position: null,
                  avatarUrl: null,
                  isWorking: true,
                  workStart: "09:00",
                  workEnd: "18:00",
                  breakStart: null,
                  breakEnd: null,
                  role: "specialist",
                }))
              : []
          }
          breaks={
            view === "day"
              ? (threeDayData
                  ? threeDayData.days.flatMap((d) => d.breaks)
                  : (dayData?.breaks ?? []))
              : (weekData?.days.flatMap((d) => d.breaks) ?? [])
          }
          calendarStep={
            view === "day"
              ? (dayData?.calendarStep ?? 30)
              : (weekData?.calendarStep ?? 30)
          }
        />
      )}
    </div>
  );
}
