"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogPanel, Select, SelectItem } from "@tremor/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { timeToMinutes, minutesToTime } from "@/lib/time";
import {
  useCreateBreak,
  useUpdateBreak,
  useDeleteBreak,
} from "@/hooks/useCalendarBreaks";
import type { CalendarBreakEntry } from "@/hooks/useCalendarEvents";
import { RiCloseLine, RiDeleteBinLine, RiLoader4Line } from "@remixicon/react";

function generateTimeSlots(step: number, startAfter?: string): string[] {
  const slots: string[] = [];
  const startMin = startAfter ? timeToMinutes(startAfter) + step : 0;
  for (let m = startMin; m < 24 * 60; m += step) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type BreakSheetState =
  | { open: false }
  | { open: true; mode: "create"; date: string; time?: string }
  | { open: true; mode: "edit"; brk: CalendarBreakEntry; date: string };

interface BreakSheetProps {
  state: BreakSheetState;
  calendarStep: number;
  onClose: () => void;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function BreakSheet({ state, calendarStep, onClose }: BreakSheetProps) {
  const isOpen = state.open;

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogPanel className="max-w-md p-0 overflow-hidden rounded-2xl">
        {state.open && state.mode === "create" && (
          <CreateContent
            date={state.date}
            prefilledTime={state.time}
            calendarStep={calendarStep}
            onClose={onClose}
          />
        )}
        {state.open && state.mode === "edit" && (
          <EditContent
            brk={state.brk}
            date={state.date}
            calendarStep={calendarStep}
            onClose={onClose}
          />
        )}
      </DialogPanel>
    </Dialog>
  );
}

// ─── Create ──────────────────────────────────────────────────────────────────

function CreateContent({
  date,
  prefilledTime,
  calendarStep,
  onClose,
}: {
  date: string;
  prefilledTime?: string;
  calendarStep: number;
  onClose: () => void;
}) {
  const t = useTranslations("calendar");
  const tc = useTranslations("common");
  const createBreak = useCreateBreak();

  const [startTime, setStartTime] = useState(prefilledTime ?? "");
  const [endTime, setEndTime] = useState(() => {
    if (prefilledTime) {
      return minutesToTime(timeToMinutes(prefilledTime) + calendarStep);
    }
    return "";
  });
  const [reason, setReason] = useState("");

  const startSlots = useMemo(() => generateTimeSlots(calendarStep), [calendarStep]);
  const endSlots = useMemo(
    () => (startTime ? generateTimeSlots(calendarStep, startTime) : []),
    [startTime, calendarStep],
  );

  const isValid = !!startTime && !!endTime;

  async function handleSubmit() {
    if (!isValid || createBreak.isPending) return;
    try {
      await createBreak.mutateAsync({
        date,
        startTime,
        endTime,
        reason: reason.trim() || undefined,
      });
      toast.success(t("breakCreated"));
      onClose();
    } catch {
      toast.error(tc("error"));
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-base font-semibold text-gray-900">{t("addBreak")}</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <RiCloseLine size={18} />
        </button>
      </div>

      {/* Form */}
      <div className="px-6 pb-4 space-y-4">
        <div className="text-sm text-gray-500">{date}</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-gray-700">
              {t("start")} <span className="text-red-500">*</span>
            </label>
            <Select
              value={startTime || undefined}
              onValueChange={(v) => {
                setStartTime(v);
                if (v) {
                  setEndTime(minutesToTime(timeToMinutes(v) + calendarStep));
                } else {
                  setEndTime("");
                }
              }}
              placeholder={t("start")}
              enableClear={false}
            >
              {startSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-gray-700">
              {t("end")} <span className="text-red-500">*</span>
            </label>
            <Select
              value={endTime || undefined}
              onValueChange={setEndTime}
              placeholder={t("end")}
              enableClear={false}
            >
              {endSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-gray-700">
            {t("reason")}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {tc("cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || createBreak.isPending}
          className="flex-1 rounded-xl bg-gray-700 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {createBreak.isPending && (
            <RiLoader4Line size={16} className="animate-spin" />
          )}
          {t("addBreak")}
        </button>
      </div>
    </div>
  );
}

// ─── Edit ────────────────────────────────────────────────────────────────────

function EditContent({
  brk,
  date,
  calendarStep,
  onClose,
}: {
  brk: CalendarBreakEntry;
  date: string;
  calendarStep: number;
  onClose: () => void;
}) {
  const t = useTranslations("calendar");
  const tc = useTranslations("common");
  const updateBreak = useUpdateBreak();
  const deleteBreak = useDeleteBreak();

  const [startTime, setStartTime] = useState(brk.startTime);
  const [endTime, setEndTime] = useState(brk.endTime);
  const [reason, setReason] = useState(brk.reason ?? "");
  const [showDelete, setShowDelete] = useState(false);

  const startSlots = useMemo(() => generateTimeSlots(calendarStep), [calendarStep]);
  const endSlots = useMemo(
    () => (startTime ? generateTimeSlots(calendarStep, startTime) : []),
    [startTime, calendarStep],
  );

  const hasChanges =
    startTime !== brk.startTime ||
    endTime !== brk.endTime ||
    (reason.trim() || null) !== (brk.reason ?? null);

  const isValid = !!startTime && !!endTime;

  async function handleSave() {
    if (!isValid || !hasChanges || updateBreak.isPending) return;
    try {
      await updateBreak.mutateAsync({
        id: brk.id,
        data: { startTime, endTime, reason: reason.trim() || undefined },
      });
      toast.success(t("breakUpdated"));
      onClose();
    } catch {
      toast.error(tc("error"));
    }
  }

  async function handleDelete() {
    try {
      await deleteBreak.mutateAsync(brk.id);
      toast.success(t("breakDeleted"));
      onClose();
    } catch {
      toast.error(tc("error"));
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-base font-semibold text-gray-900">{t("editBreak")}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <RiDeleteBinLine size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <RiCloseLine size={18} />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="mx-6 mb-3 rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-sm font-medium text-gray-900">{t("deleteBreakConfirm")}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {tc("cancel")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteBreak.isPending}
              className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {deleteBreak.isPending && (
                <RiLoader4Line size={14} className="animate-spin" />
              )}
              {tc("delete")}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="px-6 pb-4 space-y-4">
        <div className="text-sm text-gray-500">{date}</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-gray-700">
              {t("start")}
            </label>
            <Select
              value={startTime || undefined}
              onValueChange={(v) => {
                setStartTime(v);
                if (v && timeToMinutes(endTime) <= timeToMinutes(v)) {
                  setEndTime(minutesToTime(timeToMinutes(v) + calendarStep));
                }
              }}
              enableClear={false}
            >
              {startSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-gray-700">
              {t("end")}
            </label>
            <Select value={endTime || undefined} onValueChange={setEndTime} enableClear={false}>
              {endSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-gray-700">
            {t("reason")}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {tc("cancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || !isValid || updateBreak.isPending}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            hasChanges && isValid
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          {updateBreak.isPending && (
            <RiLoader4Line size={16} className="animate-spin" />
          )}
          {tc("save")}
        </button>
      </div>
    </div>
  );
}
