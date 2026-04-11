"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Clock,
  Search,
  Trash2,
  Check,
  ChevronDown,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ChronoSelect } from "@/components/ui/chrono-select";
import { cn } from "@/lib/utils";
import {
  useUpdateAppointment,
  useAvailability,
  type Appointment,
} from "@/hooks/useAppointments";
import { useServices, useServiceCategories } from "@/hooks/useServices";
import { useClientSearch, type ClientSearchResult } from "@/hooks/useClients";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppointmentPayments, useDeletePayments } from "@/hooks/usePayments";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/tremor/Select";
import { PhoneInput } from "@/components/ui/PhoneInput";
import type { SpecialistDayInfo } from "@/hooks/useCalendarDay";
import { ServiceMultiSelect } from "./ServiceMultiSelect";

const CLIENT_STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  regular: "Постоянный",
  sleeping: "Спящий",
  vip: "VIP",
  blocked: "Заблокирован",
};

const CLIENT_STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-50 text-blue-600",
  regular: "bg-green-50 text-green-600",
  sleeping: "bg-gray-100 text-gray-500",
  vip: "bg-amber-50 text-amber-600",
  blocked: "bg-red-50 text-red-600",
};

interface EditContentProps {
  appointment: Appointment;
  specialists: SpecialistDayInfo[];
  onClose: () => void;
  onSwitchToView: () => void;
  /** Open with service picker already expanded */
  initialAddService?: boolean;
}

export function EditContent({
  appointment,
  specialists,
  onClose,
  onSwitchToView,
  initialAddService,
}: EditContentProps) {
  const updateAppt = useUpdateAppointment();
  const paymentsQuery = useAppointmentPayments(appointment.id);
  const deletePayments = useDeletePayments();
  const { canDeleteAppointments } = usePermissions();

  const existingPayments = paymentsQuery.data ?? [];
  const hasPaidPayments = existingPayments.length > 0;

  // ── Form state (pre-populated from appointment) ─────────────────────────
  const [clientSearch, setClientSearch] = useState(appointment.client?.fullName ?? "");
  const [clientPhone, setClientPhone] = useState(appointment.client?.phone ?? "+7");
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(
    appointment.client
      ? {
          id: appointment.client.id,
          fullName: appointment.client.fullName,
          phone: appointment.client.phone,
          status: appointment.client.status,
        }
      : null
  );
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const workingSpecialists = useMemo(
    () => specialists.filter((s) => s.isWorking),
    [specialists]
  );
  const [specialistId, setSpecialistId] = useState(appointment.specialistId);
  const [date, setDate] = useState(appointment.date);
  const [startTime, setStartTime] = useState(appointment.startTime);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(initialAddService ?? false);

  // Pre-populate services from appointment snapshot
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    appointment.services.forEach((s) => {
      if (s.serviceId) ids.add(s.serviceId);
    });
    return ids;
  });
  const [customPrices, setCustomPrices] = useState<Record<string, string>>(() => {
    const prices: Record<string, string> = {};
    appointment.services.forEach((s) => {
      if (s.serviceId) prices[s.serviceId] = s.price;
    });
    return prices;
  });
  const [customDurations, setCustomDurations] = useState<Record<string, string>>(() => {
    const durations: Record<string, string> = {};
    appointment.services.forEach((s) => {
      if (s.serviceId) durations[s.serviceId] = String(s.durationMin);
    });
    return durations;
  });
  const [customDiscounts, setCustomDiscounts] = useState<Record<string, string>>({});


  // ── Data fetching ─────────────────────────────────────────────────────────
  const clientSearchQuery = useClientSearch(clientSearch);
  const categoriesQuery = useServiceCategories();
  const servicesQuery = useServices();

  const activeServices = useMemo(
    () => (servicesQuery.data ?? []).filter((s) => s.isActive),
    [servicesQuery.data]
  );

  // Build a map of catalog services by ID for lookup
  const serviceMap = useMemo(() => {
    const map = new Map<string, (typeof activeServices)[0]>();
    activeServices.forEach((s) => map.set(s.id, s));
    return map;
  }, [activeServices]);

  // Include appointment's snapshotted services that may no longer be in active catalog
  const selectedServices = useMemo(() => {
    return Array.from(selectedServiceIds)
      .map((id) => {
        const catalogSvc = serviceMap.get(id);
        if (catalogSvc) return catalogSvc;
        // Fallback: use snapshot data for deleted/deactivated services
        const snapshot = appointment.services.find((s) => s.serviceId === id);
        if (snapshot) {
          return {
            id: snapshot.serviceId!,
            name: snapshot.name,
            price: snapshot.price,
            cost: snapshot.cost,
            durationMin: snapshot.durationMin,
            isActive: false,
            categoryId: null,
            tenantId: appointment.tenantId,
            description: null,
            createdAt: "",
            updatedAt: "",
            category: null,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof activeServices;
  }, [selectedServiceIds, serviceMap, appointment]);

  const categoriesWithServices = useMemo(() => {
    const cats = categoriesQuery.data ?? [];
    const activeCatIds = new Set(activeServices.map((s) => s.categoryId).filter(Boolean));
    return cats.filter((c) => c.isActive && activeCatIds.has(c.id));
  }, [categoriesQuery.data, activeServices]);


  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (parseInt(customDurations[s.id], 10) || s.durationMin),
        0
      ),
    [selectedServices, customDurations]
  );

  const subtotal = useMemo(() => {
    return selectedServices.reduce((sum, svc) => {
      const custom = customPrices[svc.id];
      const price =
        custom !== undefined && custom !== ""
          ? parseFloat(custom) || 0
          : parseFloat(svc.price as string);
      return sum + price;
    }, 0);
  }, [selectedServices, customPrices]);

  const totalAfterDiscounts = useMemo(() => {
    return selectedServices.reduce((sum, svc) => {
      const custom = customPrices[svc.id];
      const price =
        custom !== undefined && custom !== ""
          ? parseFloat(custom) || 0
          : parseFloat(svc.price as string);
      const discPct = parseFloat(customDiscounts[svc.id] || "0") || 0;
      return sum + price * (1 - Math.min(discPct, 100) / 100);
    }, 0);
  }, [selectedServices, customPrices, customDiscounts]);

  // Fetch availability (excluding this appointment)
  const availabilityQuery = useAvailability(
    specialistId || undefined,
    date || undefined,
    totalDuration > 0 ? totalDuration : 30,
    appointment.id
  );

  // Ensure current startTime is in availability list or keep it
  useEffect(() => {
    if (!availabilityQuery.data || totalDuration === 0) return;
    const slotExists = availabilityQuery.data.some((s) => s.startTime === startTime);
    if (!slotExists) setStartTime("");
  }, [availabilityQuery.data, totalDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCustomPrices((p) => {
          const np = { ...p };
          delete np[id];
          return np;
        });
        setCustomDurations((d) => {
          const nd = { ...d };
          delete nd[id];
          return nd;
        });
        // If all services removed, show picker automatically
        if (next.size === 0) setShowServicePicker(false);
      } else {
        next.add(id);
        const svc = activeServices.find((s) => s.id === id);
        if (svc) {
          setCustomPrices((p) => ({ ...p, [id]: String(parseFloat(svc.price as string)) }));
          setCustomDurations((d) => ({ ...d, [id]: String(svc.durationMin) }));
        }
        // Hide picker after adding
        setShowServicePicker(false);
      }
      return next;
    });
  }

  function selectClient(client: ClientSearchResult) {
    setSelectedClient(client);
    setClientSearch(client.fullName);
    setClientPhone(client.phone ?? "");
    setShowClientDropdown(false);
  }

  function clearClient() {
    setSelectedClient(null);
    setClientSearch("");
    setClientPhone("+7");
  }

  const clientNameValue = selectedClient ? selectedClient.fullName : clientSearch.trim();
  const isValid =
    !!specialistId &&
    !!date &&
    selectedServiceIds.size > 0 &&
    !!startTime &&
    !!clientNameValue;

  async function handleDeletePayments() {
    try {
      await deletePayments.mutateAsync(appointment.id);
      toast.success("Оплата удалена");
    } catch {
      toast.error("Не удалось удалить оплату");
    }
  }

  async function handleSave() {
    if (!isValid) {
      setSubmitted(true);
      return;
    }
    if (updateAppt.isPending) return;

    try {
      // Build diff — only include changed fields
      const data: Record<string, unknown> = {};

      if (date !== appointment.date) data.date = date;
      if (startTime !== appointment.startTime) data.startTime = startTime;
      if (specialistId !== appointment.specialistId) data.specialistId = specialistId;
      if (notes !== (appointment.notes ?? "")) data.notes = notes || undefined;

      // Client change
      const newClientId = selectedClient?.id ?? null;
      if (newClientId !== appointment.clientId) {
        data.clientId = newClientId;
      }

      // Services change detection
      const origServiceMap = new Map(
        appointment.services.map((s) => [s.serviceId, s])
      );
      const servicesChanged =
        selectedServiceIds.size !== appointment.services.length ||
        Array.from(selectedServiceIds).some((id) => {
          const orig = origServiceMap.get(id);
          if (!orig) return true;
          const customPrice = customPrices[id];
          const customDur = customDurations[id];
          if (customPrice !== undefined && customPrice !== orig.price) return true;
          if (customDur !== undefined && String(customDur) !== String(orig.durationMin)) return true;
          return false;
        });

      if (servicesChanged) {
        data.services = selectedServices.map((svc) => {
          const custom = customPrices[svc.id];
          const basePrice =
            custom !== undefined && custom !== ""
              ? parseFloat(custom) || 0
              : parseFloat(svc.price as string);
          const discPct = parseFloat(customDiscounts[svc.id] || "0") || 0;
          const price = basePrice * (1 - Math.min(discPct, 100) / 100);
          return {
            serviceId: svc.id,
            name: svc.name,
            price: Math.round(price),
            cost: parseFloat((svc as { cost: string }).cost as string),
            durationMin: parseInt(customDurations[svc.id], 10) || svc.durationMin,
          };
        });
      }

      // If nothing changed, just go back
      if (Object.keys(data).length === 0) {
        onSwitchToView();
        return;
      }

      await updateAppt.mutateAsync({
        id: appointment.id,
        data: data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
      toast.success("Запись обновлена");
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      if (error.message === "TIME_CONFLICT" || error.code === "TIME_CONFLICT") {
        toast.error("Время занято, выберите другой слот");
      } else if (error.message === "SPECIALIST_NOT_WORKING") {
        toast.error("Специалист не работает в этот день");
      } else if (error.message === "OUTSIDE_WORKING_HOURS") {
        toast.error("Время за пределами рабочих часов");
      } else {
        toast.error(error.message ?? "Ошибка при обновлении записи");
      }
    }
  }

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToView}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Редактирование записи
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Payment info banner */}
        {hasPaidPayments && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">
                Внесена оплата ({existingPayments.reduce((s, p) => s + parseFloat(p.amount), 0).toLocaleString("ru-RU")} ₸). При изменении услуг итого пересчитается, разница будет учтена при завершении.
              </p>
            </div>
          </div>
        )}

        {/* ── Specialist ─────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Специалист <span className="text-red-500">*</span>
          </label>
          <Select
            value={specialistId}
            onValueChange={(v) => {
              setSpecialistId(v);
              setStartTime("");
              setShowTimeDropdown(false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите специалиста..." />
            </SelectTrigger>
            <SelectContent>
              {workingSpecialists.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Client ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 items-start">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Клиент <span className="text-red-500">*</span>
            </label>
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <span className="text-sm text-gray-800">{selectedClient.fullName}</span>
                </div>
                <button
                  type="button"
                  onClick={clearClient}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => clientSearch.length >= 2 && setShowClientDropdown(true)}
                    placeholder="Фамилия и имя клиента..."
                    className={cn(
                      "w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:ring-1",
                      submitted && !clientNameValue
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    )}
                  />
                </div>
                {showClientDropdown && clientSearch.length >= 2 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowClientDropdown(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto w-[calc(200%+0.75rem)]">
                      {clientSearchQuery.isLoading && (
                        <div className="px-3 py-2 text-sm text-gray-400">Поиск...</div>
                      )}
                      {clientSearchQuery.data?.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">Не найдено</div>
                      )}
                      {clientSearchQuery.data?.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectClient(c)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className="text-gray-800">{c.fullName}</span>
                          {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                          <span
                            className={cn(
                              "ml-auto text-xs px-1.5 py-0.5 rounded",
                              CLIENT_STATUS_STYLES[c.status] ?? "bg-gray-100 text-gray-500"
                            )}
                          >
                            {CLIENT_STATUS_LABELS[c.status] ?? c.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {submitted && !clientNameValue && (
              <p className="text-xs text-red-500">Укажите клиента</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Телефон</label>
            {selectedClient ? (
              <input
                type="tel"
                value={clientPhone}
                readOnly
                className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600 cursor-default outline-none"
              />
            ) : (
              <PhoneInput value={clientPhone} onChange={setClientPhone} />
            )}
          </div>
        </div>

        {/* ── Date + Time ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 items-start">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Дата <span className="text-red-500">*</span>
            </label>
            <ChronoSelect
              value={date ? parseISO(date) : undefined}
              onChange={(d) => {
                setDate(d ? format(d, "yyyy-MM-dd") : "");
                setStartTime("");
                setShowTimeDropdown(false);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Время <span className="text-red-500">*</span>
              </label>
              {totalDuration > 0 && (
                <span className="text-xs text-gray-400">{totalDuration} мин</span>
              )}
            </div>
            {!specialistId ? (
              <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">
                Сначала выберите специалиста
              </div>
            ) : availabilityQuery.isLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Загрузка...</span>
              </div>
            ) : (availabilityQuery.data?.length ?? 0) === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-600">
                Нет слотов
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTimeDropdown((v) => !v)}
                  className={cn(
                    "w-full flex items-center rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                    showTimeDropdown
                      ? "border-blue-500 ring-1 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300",
                    !startTime && "text-gray-400"
                  )}
                >
                  <span className="flex-1">{startTime || "Выберите время"}</span>
                  {startTime ? (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStartTime("");
                      }}
                      className="p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-gray-400 transition-transform",
                        showTimeDropdown && "rotate-180"
                      )}
                    />
                  )}
                </button>
                {showTimeDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTimeDropdown(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {availabilityQuery.data!.map((slot) => (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => {
                            setStartTime(slot.startTime);
                            setShowTimeDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-blue-50 text-left transition-colors",
                            startTime === slot.startTime && "bg-blue-50"
                          )}
                        >
                          <span
                            className={
                              startTime === slot.startTime
                                ? "text-blue-600 font-medium"
                                : "text-gray-700"
                            }
                          >
                            {slot.startTime}
                          </span>
                          {startTime === slot.startTime && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {submitted && !startTime && totalDuration > 0 && (availabilityQuery.data?.length ?? 0) > 0 && (
              <p className="text-xs text-red-500">Выберите время</p>
            )}
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* ── Services ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Услуги <span className="text-red-500">*</span>
          </label>

          {/* Show picker directly when no services selected */}
          {selectedServiceIds.size === 0 && (
            <>
              <ServiceMultiSelect
                services={activeServices}
                categories={categoriesWithServices}
                selectedIds={selectedServiceIds}
                onToggle={toggleService}
                isLoading={servicesQuery.isLoading}
                hasError={submitted && selectedServiceIds.size === 0}
                disabled={hasPaidPayments}
              />
              {submitted && (
                <p className="text-xs text-red-500">Выберите хотя бы одну услугу</p>
              )}
            </>
          )}

          {/* Selected services list with prices */}
          {selectedServices.length > 0 && (
            <div className="space-y-4">
              {selectedServices.map((svc) => (
                <div key={svc.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm text-gray-800 truncate font-medium">{svc.name}</p>
                    <button
                      type="button"
                      onClick={() => toggleService(svc.id)}
                      className="ml-2 shrink-0 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="block text-xs text-gray-500">Цена</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={customPrices[svc.id] ?? ""}
                          onChange={(e) =>
                            setCustomPrices((p) => ({ ...p, [svc.id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-7 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          ₸
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="block text-xs text-gray-500">Себестоимость</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={parseFloat((svc as { cost: string }).cost as string)}
                          disabled
                          className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 pr-7 text-sm text-gray-500 outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          ₸
                        </span>
                      </div>
                    </div>
                    <div className="w-16 shrink-0 space-y-1">
                      <label className="block text-xs text-gray-500">Мин</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={customDurations[svc.id] ?? String(svc.durationMin)}
                        onChange={(e) =>
                          setCustomDurations((d) => ({ ...d, [svc.id]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="w-16 shrink-0 space-y-1">
                      <label className="block text-xs text-gray-500">Скидка</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={customDiscounts[svc.id] ?? ""}
                          onChange={(e) =>
                            setCustomDiscounts((d) => ({ ...d, [svc.id]: e.target.value }))
                          }
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-200 px-2 py-2 pr-6 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add service button */}
              {!showServicePicker && (
                <button
                  type="button"
                  onClick={() => setShowServicePicker(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить услугу
                </button>
              )}

              {/* Inline service picker */}
              {showServicePicker && (
                <ServiceMultiSelect
                  services={activeServices}
                  categories={categoriesWithServices}
                  selectedIds={selectedServiceIds}
                  onToggle={toggleService}
                  isLoading={servicesQuery.isLoading}
                  hasError={false}
                />
              )}

              <div className="space-y-1 pt-2 border-t border-gray-100">
                {subtotal !== totalAfterDiscounts && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Сумма</span>
                    <span className="line-through">
                      {subtotal.toLocaleString("ru-RU")} ₸
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Итого</span>
                  <span>{Math.round(totalAfterDiscounts).toLocaleString("ru-RU")} ₸</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Notes ──────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Заметки</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Необязательно"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
        <button
          type="button"
          onClick={onSwitchToView}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateAppt.isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {updateAppt.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Сохранить
        </button>
      </div>
    </div>
  );
}
