"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Trash2,
  Check,
  ChevronDown,
  Package,
  Plus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/tremor/Dialog";
import { Button } from "@/components/tremor/Button";
import { Textarea } from "@/components/tremor/Textarea";
import { Label } from "@/components/tremor/Label";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ChronoSelect } from "@/components/ui/chrono-select";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useAvailability,
  type Appointment,
} from "@/hooks/useAppointments";
import { useServices, useServiceCategories, useBundles, type BundleWithItems } from "@/hooks/useServices";
import { useClientSearch, type ClientSearchResult } from "@/hooks/useClients";
import { usePermissions } from "@/hooks/usePermissions";
import { useCreatePayments, useAppointmentPayments } from "@/hooks/usePayments";
import { PaymentDialog } from "./PaymentDialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/tremor/Select";
import { PhoneInput } from "@/components/ui/PhoneInput";
import type { SpecialistDayInfo } from "@/hooks/useCalendarDay";
import { EditContent } from "./EditContent";
import { addPendingPrepayment, removePendingPrepayment } from "@/lib/pendingPrepayments";
import { ServiceMultiSelect } from "./ServiceMultiSelect";
import { AppointmentDetailsTab } from "./AppointmentDetailsTab";
import { ClientMedicalCardTab } from "./ClientMedicalCardTab";
import { AppointmentPhotosTab } from "./AppointmentPhotosTab";
import { CloseTimeCreateContent, BreakViewContent, BreakEditContent } from "./BreakSheetContent";
import type { BreakEntry } from "@/hooks/useCalendarDay";

const ROLE_LABELS: Record<string, string> = {
  specialist: "Специалист",
  admin: "Администратор",
  owner: "Владелец",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Запланирована",
  completed: "Обслужен",
  no_show: "Не явился",
  awaiting_payment: "Ждём предоплату",
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  no_show: "bg-red-100 text-red-700 border-red-200",
  awaiting_payment: "bg-amber-100 text-amber-700 border-amber-200",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  scheduled: CalendarDays,
  completed: CheckCircle2,
  no_show: XCircle,
  awaiting_payment: AlertCircle,
};

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

// ─── View mode: appointment details ──────────────────────────────────────────

interface ViewContentProps {
  appointment: Appointment;
  onClose: () => void;
  onSwitchToEdit: () => void;
  onAddService: () => void;
}

type ViewTab = "details" | "medical" | "photos";

const VIEW_TABS: { id: ViewTab; label: string }[] = [
  { id: "details", label: "О записи" },
  { id: "medical", label: "Карточка клиента" },
  { id: "photos", label: "Фото" },
];

function ViewContent({ appointment, onClose, onSwitchToEdit, onAddService }: ViewContentProps) {
  const update = useUpdateAppointment();
  const remove = useDeleteAppointment();
  const createPayments = useCreatePayments();
  const paymentsQuery = useAppointmentPayments(appointment.id);
  const { canDeleteAppointments } = usePermissions();
  const [confirmStatus, setConfirmStatus] = useState<"completed" | "no_show" | null>(null);

  // Refetch payments when appointment status changes (e.g. webhook updated status)
  const statusRef = useRef(appointment.status);
  useEffect(() => {
    if (statusRef.current !== appointment.status) {
      statusRef.current = appointment.status;
      paymentsQuery.refetch();
    }
  }, [appointment.status]); // eslint-disable-line react-hooks/exhaustive-deps
  const [showDelete, setShowDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [confirmPrepayment, setConfirmPrepayment] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("details");

  const totalPrice = parseFloat(appointment.totalPrice);
  const existingPayments = paymentsQuery.data ?? [];
  const paymentsLoaded = paymentsQuery.isSuccess;
  const prepaidTotal = existingPayments
    .filter((p) => p.isPrepayment)
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalPaid = existingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remainingPrice = totalPrice - totalPaid;
  const isFullyPaid = paymentsLoaded && remainingPrice < 0.01;

  async function handleCompleteWithPayment(payments: Array<{ method: "kaspi" | "cash" | "card" | "transfer"; amount: number }>, options?: { markCompleted?: boolean }) {
    const shouldComplete = options?.markCompleted !== false;
    try {
      await createPayments.mutateAsync({ appointmentId: appointment.id, payments, markCompleted: shouldComplete });
      toast.success(shouldComplete ? "Оплата принята, статус: Обслужен" : "Оплата записана");
      setShowPayment(false);
      if (shouldComplete) onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error.message === "ALREADY_PAID") {
        toast.error("Оплата уже записана");
      } else {
        toast.error("Не удалось принять оплату");
      }
    }
  }

  async function changeStatus(status: "completed" | "no_show") {
    try {
      if (status === "completed" && !paymentsLoaded) return;
      if (status === "completed" && !isFullyPaid) {
        setShowPayment(true);
        setConfirmStatus(null);
        return;
      }
      await update.mutateAsync({ id: appointment.id, data: { status } });
      toast.success(status === "completed" ? "Статус: Обслужен" : "Статус: Не явился");
      setConfirmStatus(null);
      onClose();
    } catch {
      toast.error("Не удалось изменить статус");
    }
  }

  const prepaymentAmount = parseFloat(appointment.prepaymentAmount);

  async function handleConfirmPrepayment() {
    try {
      // Record prepayment as transfer and change status to scheduled
      await createPayments.mutateAsync({
        appointmentId: appointment.id,
        payments: [{ method: "transfer", amount: prepaymentAmount }],
        isPrepayment: true,
        markCompleted: false,
      });
      await update.mutateAsync({ id: appointment.id, data: { status: "scheduled" } });
      toast.success("Предоплата подтверждена");
      setConfirmPrepayment(false);
      onClose();
    } catch {
      toast.error("Не удалось подтвердить предоплату");
    }
  }

  async function handleDelete() {
    try {
      const reason = deleteReason.trim();
      if (reason) {
        await update.mutateAsync({
          id: appointment.id,
          data: { cancelReason: reason },
        });
      }
      await remove.mutateAsync(appointment.id);
      toast.success("Запись удалена");
      onClose();
    } catch {
      toast.error("Не удалось удалить запись");
    }
  }

  const discountAmount = parseFloat(appointment.discountAmount);

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Детали записи
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border",
                appointment.status === "scheduled" && appointment.kaspiPending
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : STATUS_STYLES[appointment.status]
              )}
            >
              {(() => { const Icon = (appointment.status === "scheduled" && appointment.kaspiPending) ? AlertCircle : (STATUS_ICONS[appointment.status] ?? AlertCircle); return <Icon className="w-3 h-3" />; })()}
              {appointment.status === "scheduled" && appointment.kaspiPending ? "Ждём оплату" : STATUS_LABELS[appointment.status]}
            </span>
          </div>
        </div>
        <DialogClose
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </DialogClose>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-6 mt-3 border-b border-gray-200">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="overflow-y-auto px-6 py-3">
        {activeTab === "details" && (
          <AppointmentDetailsTab
            appointment={appointment}
            totalPrice={totalPrice}
            discountAmount={discountAmount}
            isPaid={existingPayments.length > 0}
            existingPayments={existingPayments}
            onEdit={onSwitchToEdit}
            onDelete={() => setShowDelete(true)}
            canDelete={canDeleteAppointments}
            onAddService={onAddService}
          />
        )}
        {activeTab === "medical" && (
          appointment.clientId ? (
            <ClientMedicalCardTab clientId={appointment.clientId} />
          ) : (
            <p className="text-center text-sm text-gray-400 py-12">Клиент не указан</p>
          )
        )}
        {activeTab === "photos" && (
          appointment.clientId ? (
            <AppointmentPhotosTab clientId={appointment.clientId} appointmentId={appointment.id} />
          ) : (
            <p className="text-center text-sm text-gray-400 py-12">Клиент не указан</p>
          )
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPayment}
        onOpenChange={(open) => {
          setShowPayment(open);
          if (!open) onClose();
        }}
        totalPrice={remainingPrice}
        appointmentId={appointment.id}
        clientPhone={appointment.client?.phone}
        onSubmit={handleCompleteWithPayment}
        isPending={createPayments.isPending}
        prepaidAmount={totalPaid}
      />

      {/* Footer — status actions + delete (only on "О записи" tab) */}
      {activeTab === "details" && <div className="px-6 pt-3 pb-6 space-y-2">
        {/* Delete confirmation modal */}
        <Dialog open={showDelete} onOpenChange={(open) => { if (!open) { setShowDelete(false); setDeleteReason(""); } }}>
          <DialogContent className="!max-w-sm">
              <div className="px-5 pt-5 pb-4 space-y-3">
                <DialogTitle>
                  Удалить запись?
                </DialogTitle>
                <p className="text-sm text-gray-500">Это действие нельзя отменить.</p>
                <Textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Причина удаления (необязательно)"
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  isLoading={remove.isPending}
                  loadingText="Удалить"
                  className="flex-1"
                >
                  Удалить
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </DialogClose>
              </div>
          </DialogContent>
        </Dialog>

        {/* Awaiting prepayment — info block, no action buttons */}
        {appointment.status === "awaiting_payment" && !showDelete && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-sm font-medium text-amber-700">
              Ожидает предоплату {prepaymentAmount > 0 && <span>{prepaymentAmount.toLocaleString("ru-RU")} ₸</span>}
            </p>
            <p className="text-xs text-amber-500 mt-0.5">Статус обновится автоматически после оплаты через Kaspi</p>
          </div>
        )}

        {/* Scheduled + Kaspi pending (final payment sent) — no buttons, info only */}
        {appointment.status === "scheduled" && appointment.kaspiPending && !showDelete && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-sm font-medium text-amber-700">Ожидает оплату через Kaspi</p>
            <p className="text-xs text-amber-500 mt-0.5">Статус обновится автоматически</p>
          </div>
        )}

        {/* Status change buttons */}
        {appointment.status === "scheduled" && !appointment.kaspiPending && !showDelete && (
          <>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setConfirmStatus("completed")}
                className="flex-1 border-transparent bg-green-600 text-white hover:bg-green-700"
              >
                Обслужен
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmStatus("no_show")}
                className="flex-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              >
                Не явился
              </Button>
            </div>
            <Dialog open={!!confirmStatus} onOpenChange={(open) => { if (!open) setConfirmStatus(null); }}>
              <DialogContent className="!max-w-sm">
                  <div className="px-5 pt-5 pb-4 space-y-3">
                    <DialogTitle>
                      {confirmStatus === "completed" ? "Обслужен?" : "Не явился?"}
                    </DialogTitle>
                    <p className="text-sm text-gray-500">
                      {confirmStatus === "completed"
                        ? "Подтвердите, что клиент обслужен."
                        : "Подтвердите, что клиент не явился."}
                    </p>
                  </div>
                  <div className="flex gap-2 px-5 pb-5">
                    <Button
                      type="button"
                      onClick={() => confirmStatus && changeStatus(confirmStatus)}
                      disabled={update.isPending || !paymentsLoaded}
                      isLoading={update.isPending}
                      loadingText="Подтвердить"
                      className={cn(
                        "flex-1",
                        confirmStatus === "completed"
                          ? "bg-green-600 hover:bg-green-700 border-transparent text-white"
                          : "bg-red-600 hover:bg-red-700 border-transparent text-white"
                      )}
                    >
                      Подтвердить
                    </Button>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                      >
                        Отмена
                      </Button>
                    </DialogClose>
                  </div>
              </DialogContent>
            </Dialog>
          </>
        )}

      </div>}
    </div>
  );
}

// ─── Create mode: full booking form ──────────────────────────────────────────

type CreateTab = "appointment" | "break";

interface CreateContentProps {
  prefilledTime?: string;
  prefilledSpecialistId?: string;
  prefilledDate?: string;
  specialists: SpecialistDayInfo[];
  calendarStep?: number;
  onClose: () => void;
}

function CreateContent({
  prefilledTime,
  prefilledDate,
  specialists,
  prefilledSpecialistId,
  calendarStep = 30,
  onClose,
}: CreateContentProps) {
  const [createTab, setCreateTab] = useState<CreateTab>("appointment");
  const createAppt = useCreateAppointment();
  const queryClient = useQueryClient();

  // ── Form state ────────────────────────────────────────────────────────────
  const [clientSearch, setClientSearch] = useState("");
  const [clientPhone, setClientPhone] = useState("+7");
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);

  const workingSpecialists = useMemo(
    () => specialists.filter((s) => s.isWorking),
    [specialists],
  );
  const [specialistId, setSpecialistId] = useState(
    prefilledSpecialistId ?? (workingSpecialists.length === 1 ? workingSpecialists[0].id : ""),
  );
  const [date, setDate] = useState(prefilledDate ?? new Date().toISOString().slice(0, 10));
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [customDurations, setCustomDurations] = useState<Record<string, string>>({});
  const [customDiscounts, setCustomDiscounts] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState(prefilledTime ?? "");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(true);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);

  // Prepayment dialog state
  const [showPrepayment, setShowPrepayment] = useState(false);
  const [prepaymentAppt, setPrepaymentAppt] = useState<{ id: string; amount: number; phone: string | null } | null>(null);
  const createPayments = useCreatePayments();
  const updateAppt = useUpdateAppointment();

  // ── Data fetching ─────────────────────────────────────────────────────────
  const clientSearchQuery = useClientSearch(clientSearch);
  const phoneDigits = clientPhone.replace(/\D/g, "").replace(/^7/, "");
  const phoneSearchQuery = useClientSearch(phoneDigits.length >= 5 ? phoneDigits : "");
  const categoriesQuery = useServiceCategories();
  const servicesQuery = useServices();
  const { data: bundles = [] } = useBundles();

  const activeBundles = useMemo(
    () => bundles.filter((b) => b.isActive),
    [bundles]
  );

  const selectedBundle = useMemo(
    () => activeBundles.find((b) => b.id === selectedBundleId) ?? null,
    [activeBundles, selectedBundleId]
  );

  const activeServices = useMemo(
    () => (servicesQuery.data ?? []).filter((s) => s.isActive),
    [servicesQuery.data]
  );

  // Categories that have at least one active service
  const categoriesWithServices = useMemo(() => {
    const cats = categoriesQuery.data ?? [];
    const activeCatIds = new Set(activeServices.map((s) => s.categoryId).filter(Boolean));
    return cats.filter((c) => c.isActive && activeCatIds.has(c.id));
  }, [categoriesQuery.data, activeServices]);


  const selectedServices = useMemo(
    () => activeServices.filter((s) => selectedServiceIds.has(s.id)),
    [activeServices, selectedServiceIds]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (parseInt(customDurations[s.id], 10) || s.durationMin), 0),
    [selectedServices, customDurations]
  );

  const subtotal = useMemo(() => {
    if (selectedBundle) {
      return parseFloat(selectedBundle.price);
    }
    return selectedServices.reduce((sum, svc) => {
      const custom = customPrices[svc.id];
      const price =
        custom !== undefined && custom !== ""
          ? parseFloat(custom) || 0
          : parseFloat(svc.price as string);
      return sum + price;
    }, 0);
  }, [selectedServices, customPrices, selectedBundle]);

  const totalAfterDiscounts = useMemo(() => {
    if (selectedBundle) return parseFloat(selectedBundle.price);
    return selectedServices.reduce((sum, svc) => {
      const custom = customPrices[svc.id];
      const price =
        custom !== undefined && custom !== ""
          ? parseFloat(custom) || 0
          : parseFloat(svc.price as string);
      const discPct = parseFloat(customDiscounts[svc.id] || "0") || 0;
      return sum + price * (1 - Math.min(discPct, 100) / 100);
    }, 0);
  }, [selectedServices, customPrices, customDiscounts, selectedBundle]);

  // Fetch availability
  const availabilityQuery = useAvailability(
    specialistId || undefined,
    date || undefined,
    totalDuration > 0 ? totalDuration : 30
  );

  // Auto-select prefilled time whenever availability reloads.
  // Only validate against real duration — skip the 30-min fallback query
  // so that prefilledTime isn't cleared before a service is chosen.
  useEffect(() => {
    if (!prefilledTime || !availabilityQuery.data) return;
    if (totalDuration === 0) {
      // No service selected yet — keep the prefilled value without validating
      setStartTime(prefilledTime);
      return;
    }
    const slotExists = availabilityQuery.data.some((s) => s.startTime === prefilledTime);
    setStartTime(slotExists ? prefilledTime : "");
  }, [availabilityQuery.data, prefilledTime, totalDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────
  function selectBundle(bundle: BundleWithItems) {
    if (selectedBundleId === bundle.id) {
      // Deselect bundle — clear everything
      setSelectedBundleId(null);
      setSelectedServiceIds(new Set());
      setCustomPrices({});
      setCustomDurations({});
      setCustomDiscounts({});
    } else {
      // Select bundle — populate services from bundle items
      setSelectedBundleId(bundle.id);
      const bundleServiceIds = new Set<string>();
      const newPrices: Record<string, string> = {};
      const newDurations: Record<string, string> = {};

      // Calculate proportional prices: each service gets a share of bundle.price
      // proportional to its original price relative to total original prices
      const bundleItems = bundle.items.filter((item) => item.serviceId && item.service);
      const totalOriginalPrice = bundleItems.reduce(
        (sum, item) => sum + (item.service ? parseFloat(item.service.price) : 0),
        0
      );
      const bundlePrice = parseFloat(bundle.price);

      bundleItems.forEach((item) => {
        if (!item.serviceId || !item.service) return;
        bundleServiceIds.add(item.serviceId);
        // Proportional price
        const originalPrice = parseFloat(item.service.price);
        const proportionalPrice =
          totalOriginalPrice > 0
            ? Math.round((originalPrice / totalOriginalPrice) * bundlePrice * 100) / 100
            : 0;
        newPrices[item.serviceId] = String(proportionalPrice);
        newDurations[item.serviceId] = String(item.service.durationMin);
      });

      setSelectedServiceIds(bundleServiceIds);
      setCustomPrices(newPrices);
      setCustomDurations(newDurations);
      setCustomDiscounts({});
      setShowServicePicker(false);
    }
    if (!prefilledTime) { setStartTime(""); setShowTimeDropdown(false); }
  }

  function toggleService(id: string) {
    // Clear bundle when manually toggling services
    if (selectedBundleId) {
      setSelectedBundleId(null);
    }

    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCustomPrices((p) => { const np = { ...p }; delete np[id]; return np; });
        setCustomDurations((d) => { const nd = { ...d }; delete nd[id]; return nd; });
        setCustomDiscounts((d) => { const nd = { ...d }; delete nd[id]; return nd; });
      } else {
        next.add(id);
        const svc = activeServices.find((s) => s.id === id);
        if (svc) {
          setCustomPrices((p) => ({ ...p, [id]: String(parseFloat(svc.price as string)) }));
          setCustomDurations((d) => ({ ...d, [id]: String(svc.durationMin) }));
          const svcDiscount = parseFloat((svc as unknown as { discount: string }).discount ?? "0");
          if (svcDiscount > 0) {
            setCustomDiscounts((d) => ({ ...d, [id]: String(svcDiscount) }));
          }
        }
        setShowServicePicker(false);
      }
      return next;
    });
    // When pre-filled from a slot click, don't clear the time — useEffect will
    // restore it once availability loads. Without prefill, reset so user repicks.
    if (!prefilledTime) { setStartTime(""); setShowTimeDropdown(false); }
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
    !!clientNameValue &&
    !!clientPhone.trim() && clientPhone.trim() !== "+7";

  async function handleSubmit() {
    if (!isValid) {
      setSubmitted(true);
      return;
    }
    if (createAppt.isPending) return;

    try {
      const bundleNote = selectedBundle
        ? `Комплекс: ${selectedBundle.name}`
        : "";
      const finalNotes = [bundleNote, notes.trim()].filter(Boolean).join("\n") || undefined;

      const created = await createAppt.mutateAsync({
        clientId: selectedClient?.id,
        clientName: !selectedClient ? clientSearch.trim() || undefined : undefined,
        clientPhone: !selectedClient && clientPhone.trim() !== "+7" ? clientPhone.trim() || undefined : undefined,
        specialistId,
        date,
        startTime,
        services: selectedServices.map((s) => {
          const custom = customPrices[s.id];
          const basePrice =
            custom !== undefined && custom !== ""
              ? parseFloat(custom) || 0
              : parseFloat(s.price as string);
          const discPct = parseFloat(customDiscounts[s.id] || "0") || 0;
          const price = basePrice * (1 - Math.min(discPct, 100) / 100);
          return {
            serviceId: s.id,
            name: s.name,
            price: Math.round(price),
            cost: parseFloat(s.cost as string),
            durationMin: parseInt(customDurations[s.id], 10) || s.durationMin,
          };
        }),
        discountPercent: 0,
        notes: finalNotes,
      });

      // If prepayment required — show payment dialog instead of closing
      if (created.prepayment?.required && created.prepayment.amount > 0) {
        const phone = selectedClient?.phone ?? (clientPhone.trim() !== "+7" ? clientPhone.trim() : null);
        addPendingPrepayment(created.id);
        setPrepaymentAppt({ id: created.id, amount: created.prepayment.amount, phone });
        setShowPrepayment(true);
        toast.success("Запись создана — требуется предоплата");
        return;
      }

      toast.success("Запись создана");
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error.message === "TIME_CONFLICT") {
        toast.error("Время занято, выберите другой слот");
      } else {
        toast.error(error.message ?? "Ошибка при создании записи");
      }
    }
  }

  async function handlePrepaymentSubmit(payments: Array<{ method: "kaspi" | "cash" | "card" | "transfer"; amount: number }>) {
    if (!prepaymentAppt) return;
    const isTransfer = payments.length === 1 && payments[0].method === "transfer";

    if (isTransfer) {
      // Transfer — card stays as awaiting_payment, visible in calendar, needs manual confirmation
      removePendingPrepayment(prepaymentAppt.id);
      queryClient.invalidateQueries({ queryKey: ["calendar-day"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Запись создана — ожидает подтверждение перевода");
      setShowPrepayment(false);
      onClose();
      return;
    }

    // Kaspi or other — process payment and confirm immediately
    try {
      await createPayments.mutateAsync({
        appointmentId: prepaymentAppt.id,
        payments,
        markCompleted: false,
        isPrepayment: true,
      });
      await updateAppt.mutateAsync({ id: prepaymentAppt.id, data: { status: "scheduled" } });
      removePendingPrepayment(prepaymentAppt.id);
      queryClient.invalidateQueries({ queryKey: ["calendar-day"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Предоплата принята, запись подтверждена");
      setShowPrepayment(false);
      onClose();
    } catch {
      toast.error("Не удалось принять предоплату");
    }
  }

  async function handleSkipPrepayment() {
    if (!prepaymentAppt) return;
    try {
      await updateAppt.mutateAsync({ id: prepaymentAppt.id, data: { status: "scheduled" } });
      removePendingPrepayment(prepaymentAppt.id);
      queryClient.invalidateQueries({ queryKey: ["calendar-day"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("Запись создана без предоплаты");
      setShowPrepayment(false);
      onClose();
    } catch {
      toast.error("Не удалось создать запись");
    }
  }

  function handlePrepaymentClose() {
    if (prepaymentAppt) removePendingPrepayment(prepaymentAppt.id);
    queryClient.invalidateQueries({ queryKey: ["calendar-day"] });
    queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
    queryClient.invalidateQueries({ queryKey: ["finance"] });
    setShowPrepayment(false);
    onClose();
  }

  // If prepayment dialog is showing, render it
  if (showPrepayment && prepaymentAppt) {
    return (
      <PaymentDialog
        open={true}
        onOpenChange={(open) => { if (!open) handlePrepaymentClose(); }}
        totalPrice={prepaymentAppt.amount}
        appointmentId={prepaymentAppt.id}
        clientPhone={prepaymentAppt.phone}
        onSubmit={handlePrepaymentSubmit}
        isPending={createPayments.isPending || updateAppt.isPending}
        allowedMethods={["kaspi", "transfer"]}
        onSkipPrepayment={handleSkipPrepayment}
      />
    );
  }

  if (createTab === "break") {
    return (
      <div className="flex flex-col max-h-[90vh]">
        {/* Header with tabs */}
        <div className="px-6 pt-4 pb-0 border-b border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <DialogTitle className="text-base font-semibold text-gray-900">
              {specialists.find((s) => s.id === specialistId)?.fullName ?? "Закрыть время"}
            </DialogTitle>
            <DialogClose
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </DialogClose>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setCreateTab("appointment")}
              className="px-3 py-1.5 text-sm font-medium rounded-t-lg text-gray-500 hover:text-gray-700 transition-colors"
            >
              О записи
            </button>
            <button
              type="button"
              onClick={() => setCreateTab("break")}
              className="px-3 py-1.5 text-sm font-medium rounded-t-lg border-b-2 border-blue-600 text-blue-600"
            >
              Закрыть время
            </button>
          </div>
        </div>
        <CloseTimeCreateContent
          prefilledTime={prefilledTime}
          prefilledSpecialistId={prefilledSpecialistId}
          prefilledDate={prefilledDate}
          specialists={specialists}
          calendarStep={calendarStep}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header with tabs */}
      <div className="px-6 pt-4 pb-0 border-b border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <DialogTitle className="text-base font-semibold text-gray-900">
            {specialists.find((s) => s.id === specialistId)?.fullName ?? "Новая запись"}
          </DialogTitle>
          <DialogClose
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </DialogClose>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setCreateTab("appointment")}
            className="px-3 py-1.5 text-sm font-medium rounded-t-lg border-b-2 border-blue-600 text-blue-600"
          >
            О записи
          </button>
          <button
            type="button"
            onClick={() => setCreateTab("break")}
            className="px-3 py-1.5 text-sm font-medium rounded-t-lg text-gray-500 hover:text-gray-700 transition-colors"
          >
            Закрыть время
          </button>
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

        {/* ── Specialist (only when not pre-filled from slot click) ─────────── */}
        {!prefilledSpecialistId && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Специалист <span className="text-red-500">*</span>
            </label>
            <Select
              value={specialistId || undefined}
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
            {submitted && !specialistId && (
              <p className="text-xs text-red-500">Выберите специалиста</p>
            )}
          </div>
        )}

        {/* ── 1+2. Client name + Phone ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 items-start">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Клиент <span className="text-red-500">*</span></label>
          {selectedClient ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
              <span className="text-sm text-gray-800">{selectedClient.fullName}</span>
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
            <p className="text-xs text-red-500">Укажите фамилию и имя клиента</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Телефон <span className="text-red-500">*</span></label>
          {selectedClient ? (
            <input
              type="tel"
              value={clientPhone}
              readOnly
              className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600 cursor-default outline-none"
            />
          ) : (
            <div className="relative">
              <PhoneInput
                value={clientPhone}
                onChange={(v) => {
                  setClientPhone(v);
                  setShowPhoneDropdown(true);
                }}
                onFocus={() => phoneDigits.length >= 5 && setShowPhoneDropdown(true)}
                className={cn(
                  submitted && (!clientPhone.trim() || clientPhone.trim() === "+7")
                    && "!border-red-400 focus:!border-red-400 focus:!ring-red-400"
                )}
              />
              {showPhoneDropdown && phoneDigits.length >= 5 && !selectedClient && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPhoneDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto w-[calc(200%+0.75rem)]">
                    {phoneSearchQuery.isLoading && (
                      <div className="px-3 py-2 text-sm text-gray-400">Поиск...</div>
                    )}
                    {phoneSearchQuery.data?.length === 0 && !phoneSearchQuery.isLoading && (
                      <div className="px-3 py-2 text-sm text-gray-400">Не найдено</div>
                    )}
                    {phoneSearchQuery.data?.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { selectClient(c); setShowPhoneDropdown(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span className="text-gray-800">{c.fullName}</span>
                        {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {submitted && (!clientPhone.trim() || clientPhone.trim() === "+7") && !selectedClient && (
            <p className="text-xs text-red-500">Укажите номер телефона</p>
          )}
        </div>
        </div>

        {/* ── Date + Time row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 items-start">
          {/* Date */}
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

          {/* Time dropdown */}
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
                      onClick={(e) => { e.stopPropagation(); setStartTime(""); }}
                      className="p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showTimeDropdown && "rotate-180")} />
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
                          <span className={startTime === slot.startTime ? "text-blue-600 font-medium" : "text-gray-700"}>
                            {slot.startTime}
                          </span>
                          {startTime === slot.startTime && <Check className="w-4 h-4 text-blue-600" />}
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

        {/* ── 3. Procedure selection ────────────────────────────────────────── */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Процедура <span className="text-red-500">*</span>
          </label>

          {/* Show full picker only when no services selected */}
          {selectedServiceIds.size === 0 && (
            <ServiceMultiSelect
              services={activeServices}
              categories={categoriesWithServices}
              selectedIds={selectedServiceIds}
              onToggle={toggleService}
              isLoading={servicesQuery.isLoading}
              hasError={submitted && selectedServiceIds.size === 0}
              bundles={activeBundles}
              onSelectBundle={selectBundle}
              selectedBundleId={selectedBundleId}
            />
          )}

          {submitted && selectedServiceIds.size === 0 && (
            <p className="text-xs text-red-500">Выберите хотя бы одну услугу</p>
          )}
        </div>

        {/* ── 4. Price / Cost per service ───────────────────────────────────── */}
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
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Inline picker or Add button */}
            {showServicePicker ? (
              <ServiceMultiSelect
                services={activeServices}
                categories={categoriesWithServices}
                selectedIds={selectedServiceIds}
                onToggle={toggleService}
                isLoading={servicesQuery.isLoading}
                hasError={false}
                defaultServiceLabel="Выбрать услугу"
                bundles={activeBundles}
                onSelectBundle={selectBundle}
                selectedBundleId={selectedBundleId}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowServicePicker(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить услугу
              </button>
            )}

            {selectedServices.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-gray-100">
                {subtotal !== totalAfterDiscounts && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Сумма</span>
                    <span className="line-through">{subtotal.toLocaleString("ru-RU")} ₸</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-gray-900">
                  <span>Итого</span>
                  <span>{Math.round(totalAfterDiscounts).toLocaleString("ru-RU")} ₸</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Notes ────────────────────────────────────────────────────────── */}
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
          variant="primary"
          onClick={handleSubmit}
          isLoading={createAppt.isPending}
          loadingText="Создать"
          className="flex-1"
        >
          Создать
        </Button>
      </div>
    </div>
  );
}

// ─── Main sheet component ─────────────────────────────────────────────────────

export interface AppointmentSheetState {
  open: boolean;
  mode: "create" | "view" | "edit";
  appointmentId?: string;
  breakId?: string;
  prefilledTime?: string;
  prefilledSpecialistId?: string;
  prefilledDate?: string;
}

interface AppointmentSheetProps extends AppointmentSheetState {
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  specialists: SpecialistDayInfo[];
  breaks?: BreakEntry[];
  calendarStep?: number;
}

export function AppointmentSheet({
  open,
  onOpenChange,
  mode,
  appointmentId,
  breakId,
  prefilledTime,
  prefilledSpecialistId,
  prefilledDate,
  appointments,
  specialists,
  breaks: breakEntries = [],
  calendarStep = 30,
}: AppointmentSheetProps) {
  const appointment = appointments.find((a) => a.id === appointmentId);
  const breakEntry = breakEntries.find((b) => b.id === breakId);

  // Internal mode allows toggling between view ↔ edit without re-opening the sheet
  const [internalMode, setInternalMode] = useState(mode);
  const [editAddService, setEditAddService] = useState(false);
  useEffect(() => {
    setInternalMode(mode);
  }, [mode, open]);

  // Reset state when sheet closes
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (!open) setKey((k) => k + 1);
  }, [open]);

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        key={key}
        className="sm:max-w-xl max-h-[90vh] rounded-xl overflow-hidden p-0"
      >
          {/* Break view/edit */}
          {breakId && breakEntry && internalMode === "view" ? (
            <BreakViewContent
              breakEntry={breakEntry}
              specialists={specialists}
              onClose={handleClose}
              onSwitchToEdit={() => setInternalMode("edit")}
            />
          ) : breakId && breakEntry && internalMode === "edit" ? (
            <BreakEditContent
              breakEntry={breakEntry}
              specialists={specialists}
              calendarStep={calendarStep}
              onClose={handleClose}
              onSwitchToView={() => setInternalMode("view")}
            />
          ) : /* Appointment view/edit/create */
          internalMode === "view" && appointment ? (
            <ViewContent
              appointment={appointment}
              onClose={handleClose}
              onSwitchToEdit={() => { setEditAddService(false); setInternalMode("edit"); }}
              onAddService={() => { setEditAddService(true); setInternalMode("edit"); }}
            />
          ) : internalMode === "edit" && appointment ? (
            <EditContent
              appointment={appointment}
              specialists={specialists}
              onClose={handleClose}
              onSwitchToView={() => { setEditAddService(false); setInternalMode("view"); }}
              initialAddService={editAddService}
            />
          ) : (
            <CreateContent
              prefilledTime={prefilledTime}
              prefilledSpecialistId={prefilledSpecialistId}
              prefilledDate={prefilledDate}
              specialists={specialists}
              calendarStep={calendarStep}
              onClose={handleClose}
            />
          )}
      </DialogContent>
    </Dialog>
  );
}
