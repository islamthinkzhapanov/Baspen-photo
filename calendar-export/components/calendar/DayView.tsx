"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Button,
  Callout,
} from "@/components/tremor";
import { timeToMinutes, minutesToTime } from "@/lib/time";
import { AppointmentBlock } from "./AppointmentBlock";
import type { SpecialistDayInfo, BreakEntry } from "@/hooks/useCalendarDay";
import { useUpdateAppointment } from "@/hooks/useAppointments";
import type { Appointment } from "@/hooks/useAppointments";
import type { ThreeDayData } from "@/hooks/useCalendarThreeDays";

/** Default pixel height of one calendar step row */
const DEFAULT_ROW_HEIGHT = 64;
/** Minimum row height so slots stay usable */
const MIN_ROW_HEIGHT = 28;
/** Width of the left time column in px */
const TIME_COL_WIDTH = 56;
/** Minimum content width per specialist column — columns expand to fill space, scroll when overflow */
const SPEC_COL_WIDTH = 200;
/** Extended calendar end hour — slots beyond workingHoursEnd scroll into view */
const EXTENDED_HOUR_END = 22;

interface GridColumn {
  key: string;
  specialist: SpecialistDayInfo;
  appointments: Appointment[];
  breaks: BreakEntry[];
  isToday: boolean;
  date: string;
}

interface DayViewProps {
  calendarStep: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  specialists: SpecialistDayInfo[];
  appointments: Appointment[];
  breaks: BreakEntry[];
  onSlotClick: (time: string, specialistId: string, slotDate?: string) => void;
  onAppointmentClick: (appointmentId: string) => void;
  onBreakClick?: (breakId: string) => void;
  isToday?: boolean;
  threeDayData?: ThreeDayData;
}

export function DayView({
  calendarStep,
  workingHoursStart,
  workingHoursEnd,
  specialists,
  appointments,
  breaks,
  onSlotClick,
  onAppointmentClick,
  onBreakClick,
  isToday = false,
  threeDayData,
}: DayViewProps) {
  const locale = useLocale();
  const isThreeDayMode = !!threeDayData;

  const columns: GridColumn[] = useMemo(() => {
    if (threeDayData) {
      return threeDayData.days.map((day) => ({
        key: day.date,
        specialist: day.specialist,
        appointments: day.appointments,
        breaks: day.breaks,
        isToday: day.isToday,
        date: day.date,
      }));
    }
    return specialists
      .filter((spec) => spec.isWorking)
      .map((spec) => ({
        key: spec.id,
        specialist: spec,
        appointments: appointments.filter((a) => a.specialistId === spec.id),
        breaks: breaks.filter((b) => b.specialistId === spec.id),
        isToday,
        date: "",
      }));
  }, [threeDayData, specialists, appointments, breaks, isToday]);

  const allAppointments = useMemo(() => {
    if (threeDayData) return threeDayData.days.flatMap((d) => d.appointments);
    return appointments;
  }, [threeDayData, appointments]);

  const extendedEnd = Math.max(workingHoursEnd, EXTENDED_HOUR_END);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let m = workingHoursStart * 60; m < extendedEnd * 60; m += calendarStep) {
      slots.push(minutesToTime(m));
    }
    return slots;
  }, [workingHoursStart, extendedEnd, calendarStep]);

  /** Outer non-scrolling div — used for ResizeObserver and arrow positioning */
  const containerRef = useRef<HTMLDivElement>(null);
  /** Actual scrollable area */
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(columns.length > 3);

  useEffect(() => {
    const container = containerRef.current;
    const header = headerRef.current;
    if (!container || !header) return;
    const compute = () => {
      setHeaderHeight(header.offsetHeight);
      const available = container.clientHeight - header.offsetHeight;
      const workingSlots = Math.ceil(
        ((workingHoursEnd - workingHoursStart) * 60) / calendarStep
      ) + 1;
      setRowHeight(Math.max(MIN_ROW_HEIGHT, Math.floor(available / workingSlots)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    return () => ro.disconnect();
  }, [workingHoursStart, workingHoursEnd, calendarStep]);

  // Update scroll-arrow visibility after columns change or on mount
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, [columns]);

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

  const updateAppointment = useUpdateAppointment();

  const [dragging, setDragging] = useState<{
    apptId: string;
    durationMin: number;
    specialistId: string;
  } | null>(null);
  const draggingRef = useRef<typeof dragging>(null);

  const [dragPreview, setDragPreview] = useState<{
    time: string;
    colKey: string;
  } | null>(null);

  const [pendingDrop, setPendingDrop] = useState<{
    appointment: Appointment;
    newTime: string;
    newSpecialistId: string;
    newDate?: string;
  } | null>(null);

  const [hoveredSlot, setHoveredSlot] = useState<{ slot: string; colKey: string } | null>(null);

  function handleConfirmDrop() {
    if (!pendingDrop) return;
    const { appointment, newTime, newSpecialistId, newDate } = pendingDrop;
    updateAppointment.mutate({
      id: appointment.id,
      data: {
        startTime: newTime,
        ...(newSpecialistId !== appointment.specialistId && { specialistId: newSpecialistId }),
        ...(newDate && newDate !== appointment.date && { date: newDate }),
      },
    });
    setPendingDrop(null);
  }

  function scrollSpecialists(dir: "left" | "right") {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -(TIME_COL_WIDTH + SPEC_COL_WIDTH) : TIME_COL_WIDTH + SPEC_COL_WIDTH,
      behavior: "smooth",
    });
  }

  function handleScroll() {
    const el = scrollAreaRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  const workStartMin = workingHoursStart * 60;

  function toTop(time: string): number {
    const min = timeToMinutes(time) - workStartMin;
    return (min / calendarStep) * rowHeight;
  }

  function toHeight(startTime: string, endTime: string): number {
    const dur = timeToMinutes(endTime) - timeToMinutes(startTime);
    return (dur / calendarStep) * rowHeight;
  }

  const totalColWidth = TIME_COL_WIDTH + SPEC_COL_WIDTH;
  const totalGridHeight = (timeSlots.length + 1) * rowHeight;
  const totalMinWidth = columns.length * totalColWidth;

  if (specialists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-24 px-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
          <Users className="w-7 h-7 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Нет активных специалистов
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
          Добавьте первого сотрудника, чтобы начать вести журнал записей и управлять расписанием
        </p>
        <a
          href={`/${locale}/staff`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать сотрудника
        </a>
      </div>
    );
  }

  return (
    <>
    {/* Outer: non-scrolling, relative for arrow positioning */}
    <div ref={containerRef} className="flex-1 overflow-hidden flex flex-col relative">

      {/* Scroll area — scrolls both axes */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-auto flex flex-col"
        onScroll={handleScroll}
      >
        <div className="flex flex-col flex-1" style={{ minWidth: totalMinWidth }}>

          {/* ─── Sticky header ──────────────────────────────────────────── */}
          <div
            ref={headerRef}
            className="shrink-0 border-b border-gray-200 bg-white sticky top-0 z-20"
          >
            {/* 3-day mode: specialist banner above day labels */}
            {isThreeDayMode && threeDayData && (
              <div className="flex flex-col items-center justify-center px-3 py-1.5 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-700 sm:text-sm truncate">
                  {threeDayData.specialist.fullName}
                </span>
                {threeDayData.specialist.position && (
                  <span className="text-[10px] sm:text-xs text-gray-400 font-normal leading-tight truncate">
                    {threeDayData.specialist.position}
                  </span>
                )}
              </div>
            )}

            {/* Column headers */}
            <div className="flex">
              {columns.map((col, colIdx) => (
                <div
                  key={col.key}
                  className="flex flex-1"
                  style={{ minWidth: totalColWidth }}
                >
                  {/* Time spacer */}
                  <div
                    className={cn("shrink-0", colIdx > 0 && "border-l border-gray-200")}
                    style={{ width: TIME_COL_WIDTH }}
                  />
                  {/* Header label */}
                  <div
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center",
                      "px-1.5 py-2 text-xs font-medium text-gray-700",
                      "sm:px-3 sm:py-2.5 sm:text-sm",
                      isThreeDayMode && col.isToday && "bg-blue-50 text-blue-700"
                    )}
                    style={{ minWidth: SPEC_COL_WIDTH }}
                  >
                    {isThreeDayMode ? (
                      /* Day label */
                      <span className={cn("truncate", col.isToday && "font-semibold")}>
                        {format(parseISO(col.date), "EEE, d MMM", { locale: ru })}
                      </span>
                    ) : (
                      /* Specialist name + position */
                      <>
                        <div className="flex items-center truncate">
                          <span className="truncate">{col.specialist.fullName}</span>
                        </div>
                        {col.specialist.position && (
                          <span className="truncate text-[10px] sm:text-xs text-gray-400 font-normal leading-tight">
                            {col.specialist.position}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Grid body ────────────────────────────────────────────────── */}
          <div className="flex relative" style={{ minHeight: totalGridHeight }}>

            {/* ─── Live time indicator (full-width across all columns) ─── */}
            {(isThreeDayMode ? columns.some((c) => c.isToday) : isToday) && nowMin >= workingHoursStart * 60 && nowMin <= extendedEnd * 60 && (
              <div
                className="absolute z-30 pointer-events-none flex items-center -translate-y-1/2"
                style={{
                  top: ((nowMin - workStartMin) / calendarStep) * rowHeight,
                  left: 0,
                  right: 0,
                }}
              >
                <div className="flex items-center justify-end shrink-0" style={{ width: TIME_COL_WIDTH }}>
                  <span className="text-xs font-bold text-white bg-blue-500 rounded px-1.5 py-0.5 leading-none whitespace-nowrap">
                    {`${String(Math.floor(nowMin / 60)).padStart(2, "0")}:${String(nowMin % 60).padStart(2, "0")}`}
                  </span>
                </div>
                <div className="flex-1 h-px bg-blue-400" />
              </div>
            )}

            {columns.map((col, colIdx) => {
              const spec = col.specialist;

              return (
                <div
                  key={col.key}
                  className="flex flex-1"
                  style={{ minWidth: totalColWidth, minHeight: totalGridHeight }}
                >
                  {/* Per-column time labels */}
                  <div
                    className={cn(
                      "shrink-0 bg-white",
                      colIdx > 0 && "border-l border-gray-200"
                    )}
                    style={{ width: TIME_COL_WIDTH }}
                  >
                    {timeSlots.map((slot) => {
                      const isHovered = hoveredSlot?.slot === slot && hoveredSlot?.colKey === col.key;
                      const slotMin = timeToMinutes(slot);
                      const isDragRange =
                        dragPreview !== null &&
                        dragging !== null &&
                        dragPreview.colKey === col.key &&
                        slotMin >= timeToMinutes(dragPreview.time) &&
                        slotMin < timeToMinutes(dragPreview.time) + dragging.durationMin;
                      const isFullHour = slot.endsWith(":00");
                      return (
                        <div
                          key={slot}
                          className={cn(
                            "flex items-start pt-1 justify-center select-none transition-colors",
                            isDragRange ? "bg-gray-100" : isHovered ? "bg-green-100" : ""
                          )}
                          style={{ height: rowHeight }}
                        >
                          <span className={cn(
                            "leading-none transition-colors",
                            isFullHour ? "text-sm font-normal" : "text-xs",
                            isDragRange
                              ? isFullHour ? "text-gray-900" : "text-gray-300"
                              : isHovered
                              ? "text-green-700"
                              : isFullHour
                              ? "text-gray-900"
                              : "text-gray-300"
                          )}>
                            {slot}
                          </span>
                        </div>
                      );
                    })}
                    {/* End-of-extended-day label */}
                    <div
                      className="flex items-start pt-1 justify-center select-none"
                      style={{ height: rowHeight }}
                    >
                      <span className="text-sm font-normal text-gray-900 leading-none">
                        {String(extendedEnd).padStart(2, "0")}:00
                      </span>
                    </div>
                  </div>

                  {/* Slots area */}
                  <div
                    className="flex-1 relative border-l border-gray-200"
                    style={{ minWidth: SPEC_COL_WIDTH, minHeight: totalGridHeight }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (!draggingRef.current) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = Math.max(0, e.clientY - rect.top);
                      const slotIndex = Math.max(0, Math.min(timeSlots.length - 1, Math.floor(y / rowHeight)));
                      const time = timeSlots[slotIndex];
                      if (dragPreview?.time !== time || dragPreview?.colKey !== col.key) {
                        setDragPreview({ time, colKey: col.key });
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const current = draggingRef.current;
                      if (!current) return;
                      const appt = allAppointments.find((a) => a.id === current.apptId);
                      if (!appt) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = Math.max(0, e.clientY - rect.top);
                      const slotIndex = Math.max(0, Math.min(timeSlots.length - 1, Math.floor(y / rowHeight)));
                      const newTime = timeSlots[slotIndex];
                      draggingRef.current = null;
                      setDragging(null);
                      setDragPreview(null);
                      setPendingDrop({
                        appointment: appt,
                        newTime,
                        newSpecialistId: spec.id,
                        newDate: isThreeDayMode ? col.date : undefined,
                      });
                    }}
                  >
                    {/* Non-working day overlay (3-day mode) */}
                    {isThreeDayMode && !spec.isWorking && (
                      <div className="absolute inset-0 bg-gray-100/70 z-[1] pointer-events-none flex items-center justify-center">
                        <span className="text-xs text-gray-400 font-medium">Выходной</span>
                      </div>
                    )}


                    {/* Horizontal grid lines */}
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

                    {/* Clickable time slot rows */}
                    {timeSlots.map((slot) => (
                      <div
                        key={slot}
                        className="group absolute left-0 right-0 hover:bg-green-200 transition-colors cursor-pointer"
                        style={{ top: toTop(slot), height: rowHeight }}
                        onMouseEnter={() => setHoveredSlot({ slot, colKey: col.key })}
                        onMouseLeave={() => setHoveredSlot(null)}
                        onClick={() => onSlotClick(slot, spec.id, isThreeDayMode ? col.date : undefined)}
                      >
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none text-green-800 text-xl font-light leading-none">
                          +
                        </span>
                      </div>
                    ))}

                    {/* Manual breaks (closed time) */}
                    {col.breaks.map((brk) => (
                      <div
                        key={brk.id}
                        className={cn(
                          "absolute left-0.5 right-0.5 bg-gray-100/70 border border-gray-200",
                          "flex items-center justify-center z-[5]",
                          onBreakClick ? "cursor-pointer hover:bg-gray-200/70 transition-colors" : "pointer-events-none"
                        )}
                        style={{
                          borderRadius: 4,
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
                    ))}

                    {/* Drag preview ghost */}
                    {dragPreview?.colKey === col.key && dragging && (() => {
                      const endMin = timeToMinutes(dragPreview.time) + dragging.durationMin;
                      const endTime = minutesToTime(endMin);
                      return (
                        <div
                          className="absolute left-0.5 right-0.5 rounded border-2 border-dashed border-gray-300 bg-gray-300/20 pointer-events-none z-20"
                          style={{
                            top: toTop(dragPreview.time),
                            height: Math.max((dragging.durationMin / calendarStep) * rowHeight, 24),
                          }}
                        >
                          <div className="absolute left-1.5 inset-y-0 flex flex-col justify-center gap-0.5">
                            <span className="text-xs text-gray-500 font-semibold leading-none">{dragPreview.time}</span>
                            <span className="text-xs text-gray-400 font-medium leading-none">{endTime}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Appointments */}
                    {col.appointments.map((appt) => (
                      <AppointmentBlock
                        key={appt.id}
                        appointment={appt}
                        top={toTop(appt.startTime)}
                        height={toHeight(appt.startTime, appt.endTime)}
                        compact
                        onClick={() => onAppointmentClick(appt.id)}
                        suppressPointerEvents={!!dragging && dragging.apptId !== appt.id}
                        onDragStart={(apptId) => {
                          const dur = timeToMinutes(appt.endTime) - timeToMinutes(appt.startTime);
                          const info = { apptId, durationMin: dur, specialistId: spec.id };
                          draggingRef.current = info;
                          setDragging(info);
                        }}
                        onDragEnd={() => {
                          draggingRef.current = null;
                          setDragging(null);
                          setDragPreview(null);
                        }}
                        isDragging={dragging?.apptId === appt.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Left scroll arrow ────────────────────────────────────────────── */}
      {canScrollLeft && headerHeight > 0 && (
        <button
          type="button"
          onClick={() => scrollSpecialists("left")}
          className="absolute top-0 left-0 z-40 flex items-center justify-center bg-white/95 hover:bg-white border-r border-gray-200 shadow-sm transition-colors"
          style={{ height: headerHeight, width: 28 }}
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* ─── Right scroll arrow ───────────────────────────────────────────── */}
      {canScrollRight && headerHeight > 0 && (
        <button
          type="button"
          onClick={() => scrollSpecialists("right")}
          className="absolute top-0 right-0 z-40 flex items-center justify-center bg-white/95 hover:bg-white border-l border-gray-200 shadow-sm transition-colors"
          style={{ height: headerHeight, width: 28 }}
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>

    {/* ─── Confirm drag & drop modal ───────────────────────────────────────── */}
    {pendingDrop && (() => {
      const { appointment, newTime, newSpecialistId, newDate } = pendingDrop;
      const timeChanged = newTime !== appointment.startTime;
      const dateChanged = !!newDate && newDate !== appointment.date;
      const specialistChanged = newSpecialistId !== appointment.specialistId;
      const oldSpec = specialists.length > 0
        ? specialists.find((s) => s.id === appointment.specialistId)
        : threeDayData?.specialist;
      const newSpec = specialists.length > 0
        ? specialists.find((s) => s.id === newSpecialistId)
        : threeDayData?.specialist;
      const hasPhone = !!appointment.client?.phone;
      const serviceNames = appointment.services.map((s) => s.name).join(", ");
      const clientName = appointment.client?.fullName ?? "Без клиента";
      const changesText = [
        timeChanged && "смене времени",
        dateChanged && "смене даты",
        specialistChanged && "смене специалиста",
      ].filter(Boolean).join(" и ");

      return (
        <Dialog open onOpenChange={(open) => { if (!open) setPendingDrop(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Перенести запись?</DialogTitle>
            </DialogHeader>

            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Услуга</p>
                <p className="text-sm font-medium text-gray-900 truncate">{serviceNames}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Клиент</p>
                <p className="text-sm font-medium text-gray-900">{clientName}</p>
              </div>
              {dateChanged && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Дата</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(parseISO(appointment.date), "d MMM", { locale: ru })} → {format(parseISO(newDate!), "d MMM", { locale: ru })}
                  </p>
                </div>
              )}
              {timeChanged && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Время</p>
                  <p className="text-sm font-medium text-gray-900">
                    {appointment.startTime} → {newTime}
                  </p>
                </div>
              )}
              {specialistChanged && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Специалист</p>
                  <p className="text-sm font-medium text-gray-900">
                    {oldSpec?.fullName ?? "—"} → {newSpec?.fullName ?? "—"}
                  </p>
                </div>
              )}
            </div>

            {hasPhone && (
              <Callout variant="success" title="">
                Клиент получит уведомление в WhatsApp о {changesText}.
              </Callout>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">
                  Отмена
                </Button>
              </DialogClose>
              <Button variant="primary" onClick={handleConfirmDrop}>
                Подтвердить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    })()}
    </>
  );
}
