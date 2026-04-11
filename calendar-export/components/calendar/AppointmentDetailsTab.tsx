"use client";

import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/tremor/Button";
import type { Appointment } from "@/hooks/useAppointments";

const CLIENT_STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  regular: "Постоянный",
  sleeping: "Спящий",
  vip: "VIP",
  blocked: "Заблокирован",
};

const CLIENT_STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  regular: "bg-green-100 text-green-700",
  sleeping: "bg-gray-100 text-gray-500",
  vip: "bg-amber-100 text-amber-700",
  blocked: "bg-red-100 text-red-700",
};

interface AppointmentDetailsTabProps {
  appointment: Appointment;
  totalPrice: number;
  discountAmount: number;
  isPaid: boolean;
  existingPayments: Array<{ id: string; method: string; amount: string; isPrepayment: boolean }>;
  onEdit?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  onAddService?: () => void;
}

export function AppointmentDetailsTab({
  appointment,
  totalPrice,
  discountAmount,
  isPaid,
  existingPayments,
  onEdit,
  onDelete,
  canDelete,
  onAddService,
}: AppointmentDetailsTabProps) {
  const dateFormatted = (() => {
    try {
      return format(parseISO(appointment.date), "d MMMM yyyy", { locale: ru });
    } catch {
      return appointment.date;
    }
  })();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Информация</h3>
        <div className="flex shrink-0 items-center gap-3">
          {onEdit && appointment.status === "scheduled" && (
            <button
              type="button"
              onClick={onEdit}
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
              Редактировать
            </button>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Удалить запись
            </button>
          )}
        </div>
      </div>

      {/* Date & Time + Specialist */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 px-3.5 py-3">
          <span className="text-xs text-gray-400 mb-1.5 block">Дата и время</span>
          <p className="text-sm font-medium text-gray-900">{dateFormatted}</p>
          <p className="text-sm text-gray-600">{appointment.startTime} – {appointment.endTime}</p>
        </div>

        <div className="rounded-xl bg-gray-50 px-3.5 py-3">
          <span className="text-xs text-gray-400 mb-1.5 block">Специалист</span>
          <p className="text-sm font-medium text-gray-900">
            {appointment.specialist?.fullName ?? "—"}
          </p>
        </div>
      </div>

      {/* Client */}
      <div className="rounded-xl bg-gray-50 px-3.5 py-3">
        <span className="text-xs text-gray-400 mb-1.5 block">Клиент</span>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">
              {appointment.client?.fullName ?? "Без клиента"}
            </p>
            {appointment.client?.status && (
              <span className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                CLIENT_STATUS_STYLES[appointment.client.status] ?? "bg-gray-100 text-gray-500"
              )}>
                {CLIENT_STATUS_LABELS[appointment.client.status] ?? appointment.client.status}
              </span>
            )}
          </div>
          {appointment.client?.phone && (
            <p className="text-sm text-gray-500">{appointment.client.phone}</p>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="rounded-xl bg-gray-50 px-3.5 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Услуги</span>
        </div>
        <div className="space-y-1.5">
          {appointment.services.map((svc) => (
            <div key={svc.id} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{svc.name}</span>
              <span className="text-sm font-semibold text-gray-700 tabular-nums">
                {parseFloat(svc.price).toLocaleString("ru-RU")} ₸
              </span>
            </div>
          ))}
        </div>
      </div>

      {onAddService && appointment.status === "scheduled" && (
        <Button
          type="button"
          variant="secondary"
          onClick={onAddService}
        >
          <PlusIcon className="w-4 h-4" />
          Добавить услугу
        </Button>
      )}

      {/* Totals */}
      <div className="space-y-1.5 pt-1">
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Скидка ({appointment.discountPercent}%)</span>
            <span className="text-red-500 tabular-nums">
              −{discountAmount.toLocaleString("ru-RU")} ₸
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm font-semibold text-gray-900">Итого</span>
          <span className="text-base font-bold text-gray-900 tabular-nums">
            {totalPrice.toLocaleString("ru-RU")} ₸
          </span>
        </div>
      </div>

      {/* Payment info */}
      {existingPayments.length > 0 && (() => {
        const prepayments = existingPayments.filter((p) => p.isPrepayment);
        const finalPayments = existingPayments.filter((p) => !p.isPrepayment);
        const methodLabel = (m: string) =>
          m === "kaspi" ? "Kaspi" : m === "cash" ? "Наличные" : m === "card" ? "Карта" : "Перевод";
        return (
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-3 space-y-1.5">
            {prepayments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-green-600">Предоплата</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">{methodLabel(p.method)}</span>
                </div>
                <span className="font-medium text-green-700 tabular-nums">
                  {parseFloat(p.amount).toLocaleString("ru-RU")} ₸
                </span>
              </div>
            ))}
            {finalPayments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-green-600">Оплата</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">{methodLabel(p.method)}</span>
                </div>
                <span className="font-medium text-green-700 tabular-nums">
                  {parseFloat(p.amount).toLocaleString("ru-RU")} ₸
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Notes */}
      {appointment.notes && (
        <div className="rounded-xl bg-amber-50/60 border border-amber-100 px-3.5 py-3">
          <span className="text-xs font-medium text-amber-700 mb-1 block">Заметки</span>
          <p className="text-sm text-amber-900">{appointment.notes}</p>
        </div>
      )}
    </div>
  );
}
