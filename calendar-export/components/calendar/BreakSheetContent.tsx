"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Clock, User, X } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChronoSelect } from "@/components/ui/chrono-select";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/tremor/Select";
import { useCreateBreak, useUpdateBreak, useDeleteBreak } from "@/hooks/useBreaks";
import { usePermissions } from "@/hooks/usePermissions";
import { timeToMinutes, minutesToTime } from "@/lib/time";
import type { SpecialistDayInfo, BreakEntry } from "@/hooks/useCalendarDay";
import { DialogTitle, DialogClose } from "@/components/tremor/Dialog";
import { Button } from "@/components/tremor/Button";
import { Textarea } from "@/components/tremor/Textarea";
import { Label } from "@/components/tremor/Label";

// ─── Time slot generation ────────────────────────────────────────────────────

function generateTimeSlots(step: number = 30, startAfter?: string): string[] {
  const slots: string[] = [];
  const startMin = startAfter ? timeToMinutes(startAfter) + step : 0;
  for (let m = startMin; m < 24 * 60; m += step) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

// ─── Create form ─────────────────────────────────────────────────────────────

interface CloseTimeCreateContentProps {
  prefilledTime?: string;
  prefilledSpecialistId?: string;
  prefilledDate?: string;
  specialists: SpecialistDayInfo[];
  calendarStep?: number;
  onClose: () => void;
}

export function CloseTimeCreateContent({
  prefilledTime,
  prefilledSpecialistId,
  prefilledDate,
  specialists,
  calendarStep = 30,
  onClose,
}: CloseTimeCreateContentProps) {
  const createBreak = useCreateBreak();

  const workingSpecialists = useMemo(
    () => specialists.filter((s) => s.isWorking),
    [specialists],
  );

  const [specialistId, setSpecialistId] = useState(
    prefilledSpecialistId ?? (workingSpecialists.length === 1 ? workingSpecialists[0].id : ""),
  );
  const [date, setDate] = useState(prefilledDate ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(prefilledTime ?? "");
  const [endTime, setEndTime] = useState(() => {
    if (prefilledTime) {
      return minutesToTime(timeToMinutes(prefilledTime) + calendarStep);
    }
    return "";
  });
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const startSlots = useMemo(() => generateTimeSlots(calendarStep), [calendarStep]);
  const endSlots = useMemo(
    () => (startTime ? generateTimeSlots(calendarStep, startTime) : []),
    [startTime, calendarStep],
  );

  const isValid = !!specialistId && !!date && !!startTime && !!endTime;

  async function handleSubmit() {
    if (!isValid) {
      setSubmitted(true);
      return;
    }
    if (createBreak.isPending) return;

    try {
      await createBreak.mutateAsync({
        specialistId,
        date,
        startTime,
        endTime,
        reason: reason.trim() || undefined,
      });
      toast.success("Время закрыто");
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message ?? "Ошибка при закрытии времени");
    }
  }

  return (
    <div className="flex flex-col max-h-[90vh]">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Specialist */}
        {!prefilledSpecialistId && (
          <div className="space-y-1.5">
            <Label>
              Специалист <span className="text-red-500">*</span>
            </Label>
            <Select value={specialistId || undefined} onValueChange={setSpecialistId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите специалиста" />
              </SelectTrigger>
              <SelectContent>
                {workingSpecialists.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !specialistId && (
              <p className="text-xs text-red-500">Выберите специалиста</p>
            )}
          </div>
        )}

        {/* Date & Time row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label>
              Дата <span className="text-red-500">*</span>
            </Label>
            <ChronoSelect
              value={date ? parseISO(date) : undefined}
              onChange={(d) => setDate(d ? format(d, "yyyy-MM-dd") : "")}
            />
          </div>

          {/* Start time */}
          <div className="space-y-1.5">
            <Label>
              Начало <span className="text-red-500">*</span>
            </Label>
            <Select
              value={startTime || undefined}
              onValueChange={(v) => {
                setStartTime(v);
                if (v) {
                  const newEnd = minutesToTime(timeToMinutes(v) + calendarStep);
                  setEndTime(newEnd);
                } else {
                  setEndTime("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Начало" />
              </SelectTrigger>
              <SelectContent>
                {startSlots.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !startTime && (
              <p className="text-xs text-red-500">Укажите начало</p>
            )}
          </div>

          {/* End time */}
          <div className="space-y-1.5">
            <Label>
              Конец <span className="text-red-500">*</span>
            </Label>
            <Select value={endTime || undefined} onValueChange={setEndTime}>
              <SelectTrigger>
                <SelectValue placeholder="Конец" />
              </SelectTrigger>
              <SelectContent>
                {endSlots.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !endTime && (
              <p className="text-xs text-red-500">Укажите конец</p>
            )}
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <Label>Причина</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Необязательно"
            className="resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          Отмена
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          isLoading={createBreak.isPending}
          loadingText="Закрыть время"
          className="flex-1 bg-gray-700 hover:bg-gray-800 border-transparent text-white"
        >
          Закрыть время
        </Button>
      </div>
    </div>
  );
}

// ─── View content ────────────────────────────────────────────────────────────

interface BreakViewContentProps {
  breakEntry: BreakEntry;
  specialists: SpecialistDayInfo[];
  onClose: () => void;
  onSwitchToEdit: () => void;
}

export function BreakViewContent({
  breakEntry,
  specialists,
  onClose,
  onSwitchToEdit,
}: BreakViewContentProps) {
  const deleteBreak = useDeleteBreak();
  const { role, userId } = usePermissions();
  const [showDelete, setShowDelete] = useState(false);

  const specialist = specialists.find((s) => s.id === breakEntry.specialistId);

  const canManage =
    role === "owner" ||
    role === "admin" ||
    breakEntry.specialistId === userId;

  async function handleDelete() {
    try {
      await deleteBreak.mutateAsync(breakEntry.id);
      toast.success("Закрытое время удалено");
      onClose();
    } catch {
      toast.error("Не удалось удалить");
    }
  }

  const dateFormatted = (() => {
    try {
      return format(parseISO(breakEntry.date), "d MMMM yyyy", { locale: ru });
    } catch {
      return breakEntry.date;
    }
  })();

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Закрытое время
          </DialogTitle>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200 mt-1">
            <Clock className="w-3 h-3" />
            Закрытое время
          </span>
        </div>
        <DialogClose
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </DialogClose>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {/* Action buttons row */}
        {canManage && !showDelete && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Информация</h3>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={onSwitchToEdit}
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                Редактировать
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Удалить
              </button>
            </div>
          </div>
        )}

        {/* Date & Time + Specialist */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 px-3.5 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">Дата и время</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{dateFormatted}</p>
            <p className="text-sm text-gray-600">{breakEntry.startTime} – {breakEntry.endTime}</p>
          </div>

          <div className="rounded-xl bg-gray-50 px-3.5 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">Специалист</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {specialist?.fullName ?? "—"}
            </p>
          </div>
        </div>

        {/* Reason */}
        {breakEntry.reason && (
          <div className="rounded-xl bg-amber-50/60 border border-amber-100 px-3.5 py-3">
            <span className="text-xs font-medium text-amber-700 mb-1 block">Причина</span>
            <p className="text-sm text-amber-900">{breakEntry.reason}</p>
          </div>
        )}

        {/* Delete confirmation */}
        {showDelete && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Удалить закрытое время?</p>
                <p className="text-xs text-gray-500">Это действие нельзя отменить</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDelete(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                isLoading={deleteBreak.isPending}
                loadingText="Удалить"
                className="flex-1"
              >
                Удалить
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit content ────────────────────────────────────────────────────────────

interface BreakEditContentProps {
  breakEntry: BreakEntry;
  specialists: SpecialistDayInfo[];
  calendarStep?: number;
  onClose: () => void;
  onSwitchToView: () => void;
}

export function BreakEditContent({
  breakEntry,
  specialists,
  calendarStep = 30,
  onClose,
  onSwitchToView,
}: BreakEditContentProps) {
  const updateBreak = useUpdateBreak();

  const [startTime, setStartTime] = useState(breakEntry.startTime);
  const [endTime, setEndTime] = useState(breakEntry.endTime);
  const [reason, setReason] = useState(breakEntry.reason ?? "");

  const specialist = specialists.find((s) => s.id === breakEntry.specialistId);

  const startSlots = useMemo(() => generateTimeSlots(calendarStep), [calendarStep]);
  const endSlots = useMemo(
    () => (startTime ? generateTimeSlots(calendarStep, startTime) : []),
    [startTime, calendarStep],
  );

  const hasChanges =
    startTime !== breakEntry.startTime ||
    endTime !== breakEntry.endTime ||
    (reason.trim() || null) !== (breakEntry.reason ?? null);

  const isValid = !!startTime && !!endTime;

  async function handleSave() {
    if (!isValid || !hasChanges) return;
    if (updateBreak.isPending) return;

    try {
      await updateBreak.mutateAsync({
        id: breakEntry.id,
        data: {
          startTime,
          endTime,
          reason: reason.trim() || undefined,
        },
      });
      toast.success("Закрытое время обновлено");
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message ?? "Ошибка при обновлении");
    }
  }

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Редактировать закрытое время
          </DialogTitle>
          {specialist && (
            <p className="text-sm text-gray-500 mt-0.5">{specialist.fullName}</p>
          )}
        </div>
        <DialogClose
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </DialogClose>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>
              Начало <span className="text-red-500">*</span>
            </Label>
            <Select
              value={startTime || undefined}
              onValueChange={(v) => {
                setStartTime(v);
                if (v && timeToMinutes(endTime) <= timeToMinutes(v)) {
                  setEndTime(minutesToTime(timeToMinutes(v) + calendarStep));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Начало" />
              </SelectTrigger>
              <SelectContent>
                {startSlots.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>
              Конец <span className="text-red-500">*</span>
            </Label>
            <Select value={endTime || undefined} onValueChange={setEndTime}>
              <SelectTrigger>
                <SelectValue placeholder="Конец" />
              </SelectTrigger>
              <SelectContent>
                {endSlots.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Причина</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Необязательно"
            className="resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onSwitchToView}
          className="flex-1"
        >
          Назад
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges || !isValid}
          isLoading={updateBreak.isPending}
          loadingText="Сохранить"
          className={cn(
            "flex-1",
            (!hasChanges || !isValid) && "!bg-gray-300 !cursor-not-allowed"
          )}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
}
