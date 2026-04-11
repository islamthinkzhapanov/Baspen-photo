"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/tremor/Dialog";
import { Button } from "@/components/tremor/Button";
import {
  BanknotesIcon,
  CreditCardIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useCreateKaspiInvoice,
  useKaspiInvoiceStatus,
  useCancelKaspiInvoice,
} from "@/hooks/useKaspiPayment";

type PaymentMethod = "kaspi" | "cash" | "card" | "transfer";

interface PaymentLine {
  method: PaymentMethod;
  amount: string;
}

const METHOD_STYLES: Record<PaymentMethod, { active: string; inactive: string }> = {
  kaspi:    { active: "bg-[#F14635] text-white", inactive: "text-gray-500 hover:text-gray-700 hover:bg-gray-50" },
  cash:     { active: "bg-blue-600 text-white", inactive: "text-gray-500 hover:text-gray-700 hover:bg-gray-50" },
  card:     { active: "bg-blue-600 text-white", inactive: "text-gray-500 hover:text-gray-700 hover:bg-gray-50" },
  transfer: { active: "bg-blue-600 text-white", inactive: "text-gray-500 hover:text-gray-700 hover:bg-gray-50" },
};

function KaspiIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 23 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12.0373 12.8635C14.0956 13.1951 14.3739 14.4659 14.5402 15.6487L14.568 15.8504L14.5869 15.9877L14.6871 16.6838C14.8832 18.0128 15.2923 20.7716 15.2923 22.2112C15.2923 22.571 15.2619 22.8472 15.2065 22.9989C15.1142 23.2327 14.8451 23.4572 14.4735 23.6442C13.5744 23.8751 12.6346 24 11.6666 24C11.5641 24 11.4633 23.9948 11.3621 23.9917C10.9709 23.8757 10.6768 23.6821 10.5211 23.4176C10.0511 22.6192 10.0228 20.8402 10.0133 18.7614L10.0123 18.5203L10.0084 17.8972C9.99314 15.6964 9.97999 13.7989 10.7462 13.118C11.043 12.8561 11.4647 12.7694 12.0373 12.8635ZM7.54953 17.6549C7.99559 17.6287 8.28244 19.9181 8.34009 21.6541C8.38048 22.8627 8.25887 23.3599 8.06466 23.5384C7.8448 23.4618 7.62874 23.3789 7.41585 23.2889C7.27382 23.0196 7.16527 22.596 7.09631 22.0412C6.88575 20.2975 7.06865 17.6856 7.54953 17.6549ZM18.7322 21.0761C18.7044 21.2351 18.6651 21.3579 18.6168 21.4616C18.2354 21.7809 17.8346 22.0741 17.4151 22.3379C17.2815 22.3613 17.1628 22.345 17.1048 22.2427C16.5489 21.2234 16.3402 18.0256 16.8782 17.7473C17.5796 17.3938 18.8362 20.5232 18.7322 21.0761ZM11.5006 0C17.7635 0 22.8567 5.17546 22.9971 11.6155L23 11.8381V11.941C22.9885 14.85 21.9626 17.5114 20.2723 19.5714C20.211 19.5393 20.0992 19.4342 19.8966 19.118C19.6869 18.8 17.8788 15.8965 17.8788 12.5686C17.8788 11.9155 18.781 10.8953 19.5793 9.99975C20.1761 9.32588 20.7414 8.69025 20.9495 8.19068C21.2147 7.54605 21.0292 7.09594 20.7358 6.94337C20.4702 6.80777 20.0715 6.90668 19.7917 7.42523C19.3326 8.26447 19.1854 8.4213 18.5157 8.98283C17.8567 9.54405 16.809 10.109 16.809 9.3777C16.809 8.98283 17.3925 8.08853 17.6808 7.46168C17.9752 6.82783 17.6579 6.36897 17.05 6.36897C15.8562 6.36897 15.0638 7.95578 15.0638 8.50553C15.0638 9.05483 15.3192 9.13305 15.3192 9.77273C15.3192 10.4172 14.0094 11.2531 12.7756 11.2531C11.5877 11.2531 10.8988 11.0023 10.6134 10.2955L10.577 10.1963L10.4945 9.94155C10.2018 9.04897 9.99185 8.40165 9.62636 7.72515C9.4323 7.3674 9.13287 7.11939 8.8739 6.90117C8.53544 6.62684 8.35985 6.37426 8.3232 6.18588C8.28942 5.99899 8.27123 5.64678 8.84983 4.83487C9.4272 4.0276 9.50813 3.41775 9.21919 3.10307C9.11447 2.99113 8.93593 2.9194 8.70665 2.9194C8.30113 2.9194 7.73763 3.14362 7.15692 3.75949C6.2542 4.7247 6.76668 5.64112 6.76668 6.04341C6.76668 6.44544 6.6013 6.67285 6.05957 7.2198C5.51388 7.76918 5.32554 8.24017 5.26313 10.1332C5.23922 11.1085 5.0746 11.67 4.92682 12.1679C4.79913 12.6042 4.68169 13.0145 4.67535 13.6072C4.66523 14.264 4.77001 14.6873 4.89229 15.1757C5.01234 15.6272 5.13985 16.1444 5.22154 17.0097C5.35147 18.3491 5.3063 19.4806 5.07006 20.637L5.00701 20.9267L4.99228 21.01C4.9439 21.2132 4.88639 21.4601 4.80866 21.5525C1.89805 19.3953 0 15.8722 0 11.8898C0 5.32382 5.14876 0 11.5006 0Z" />
    </svg>
  );
}

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "kaspi", label: "Kaspi", icon: KaspiIcon },
  { value: "cash", label: "Наличные", icon: BanknotesIcon },
  { value: "card", label: "Карта", icon: CreditCardIcon },
  { value: "transfer", label: "Перевод", icon: ArrowsRightLeftIcon },
];

// ─── Kaspi phone formatter ────────────────────────────────────────────────────

function formatKaspiPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Normalize: +7 → 8, 7 → 8
  let d = digits;
  if (d.startsWith("7") && d.length <= 11) d = "8" + d.slice(1);
  if (d.length > 11) d = d.slice(0, 11);

  // Format: 8 (7XX) XXX-XX-XX
  if (d.length <= 1) return d;
  let out = d[0];
  if (d.length > 1) out += " (" + d.slice(1, 4);
  if (d.length >= 4) out += ") ";
  if (d.length > 4) out += d.slice(4, 7);
  if (d.length > 7) out += "-" + d.slice(7, 9);
  if (d.length > 9) out += "-" + d.slice(9, 11);
  return out;
}

function stripPhone(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

// ─── Types ────────────────────────────────────────────────────────────────────

type KaspiStep = "form" | "waiting" | "result";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPrice: number;
  appointmentId: string;
  clientPhone?: string | null;
  onSubmit: (payments: Array<{ method: PaymentMethod; amount: number }>, options?: { markCompleted?: boolean }) => Promise<void>;
  isPending: boolean;
  /** Restrict available payment methods (e.g. for prepayment: ["kaspi", "transfer"]) */
  allowedMethods?: PaymentMethod[];
  /** Amount already paid as prepayment (shown for context in the dialog) */
  prepaidAmount?: number;
  /** Called when user chooses to skip prepayment for trusted clients */
  onSkipPrepayment?: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  totalPrice,
  appointmentId,
  clientPhone,
  onSubmit,
  isPending,
  allowedMethods,
  prepaidAmount,
  onSkipPrepayment,
}: PaymentDialogProps) {
  const [activeTab, setActiveTab] = useState<"prepayment" | "skip">("prepayment");
  const [lines, setLines] = useState<PaymentLine[]>([
    { method: "kaspi", amount: String(totalPrice) },
  ]);

  // Kaspi-specific state
  const [kaspiPhone, setKaspiPhone] = useState("");
  const [kaspiStep, setKaspiStep] = useState<KaspiStep>("form");
  const [kaspiInvoiceId, setKaspiInvoiceId] = useState<string>();

  const createKaspi = useCreateKaspiInvoice();
  const cancelKaspi = useCancelKaspiInvoice();
  const { data: kaspiStatus } = useKaspiInvoiceStatus(
    kaspiInvoiceId,
    kaspiStep === "waiting"
  );

  // Pre-fill phone from client data
  useEffect(() => {
    if (clientPhone) {
      const digits = clientPhone.replace(/\D/g, "");
      // Normalize +7 to 8
      const normalized = digits.startsWith("7") ? "8" + digits.slice(1) : digits;
      setKaspiPhone(formatKaspiPhone(normalized));
    }
  }, [clientPhone]);

  // React to status changes
  useEffect(() => {
    if (!kaspiStatus) return;
    if (kaspiStatus.status === "paid" || kaspiStatus.status === "cancelled" || kaspiStatus.status === "expired") {
      setKaspiStep("result");
    }
  }, [kaspiStatus]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setKaspiStep("form");
      setKaspiInvoiceId(undefined);
      setLines([{ method: "kaspi", amount: String(totalPrice) }]);
      createKaspi.reset();
    }
  }, [open, totalPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsedAmounts = lines.map((l) => parseFloat(l.amount) || 0);
  const totalPaid = parsedAmounts.reduce((sum, a) => sum + a, 0);
  const diff = totalPrice - totalPaid;
  const isValid = Math.abs(diff) < 0.01 && lines.every((l) => parseFloat(l.amount) > 0);

  // Check if any line uses Kaspi
  const hasKaspiLine = lines.some((l) => l.method === "kaspi");
  const kaspiLine = lines.find((l) => l.method === "kaspi");
  const kaspiAmount = kaspiLine ? parseFloat(kaspiLine.amount) || 0 : 0;
  const isKaspiPhoneValid = stripPhone(kaspiPhone).length === 11;

  function addLine() {
    const remaining = Math.max(0, totalPrice - totalPaid);
    setLines((prev) => [...prev, { method: "cash", amount: remaining > 0 ? String(remaining) : "" }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof PaymentLine, value: string) {
    setLines((prev) => {
      const next = prev.map((l, i) => (i === index ? { ...l, [field]: value } : l));
      // Auto-adjust first line when editing amount in other lines
      if (field === "amount" && index > 0 && next.length > 1) {
        const otherSum = next.reduce((sum, l, i) => i === 0 ? sum : sum + (parseFloat(l.amount) || 0), 0);
        const remaining = Math.max(0, totalPrice - otherSum);
        next[0] = { ...next[0], amount: String(remaining) };
      }
      return next;
    });
  }

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;

    // If has Kaspi line — create Kaspi invoice first
    if (hasKaspiLine && kaspiAmount > 0) {
      if (!isKaspiPhoneValid) return;

      try {
        await createKaspi.mutateAsync({
          appointmentId,
          phone: stripPhone(kaspiPhone),
          amount: kaspiAmount,
        });

        // Submit non-Kaspi lines if any (don't mark completed — Kaspi part is still pending)
        const otherLines = lines.filter((l) => l.method !== "kaspi");
        const hasOther = otherLines.some((l) => parseFloat(l.amount) > 0);
        if (hasOther) {
          await onSubmit(otherLines.map((l) => ({ method: l.method, amount: parseFloat(l.amount) })), { markCompleted: false });
        }

        // Close immediately — calendar will auto-update when payment confirms
        toast.success("Счёт выставлен в Kaspi");
        onOpenChange(false);
      } catch {
        // Error handled by mutation state
      }
      return;
    }

    // No Kaspi — standard payment flow
    await onSubmit(lines.map((l) => ({ method: l.method, amount: parseFloat(l.amount) })));
  }, [isValid, hasKaspiLine, kaspiAmount, isKaspiPhoneValid, appointmentId, kaspiPhone, lines, onSubmit, createKaspi]);

  async function handleCancelKaspi() {
    if (kaspiInvoiceId) {
      await cancelKaspi.mutateAsync(kaspiInvoiceId);
      setKaspiStep("form");
      setKaspiInvoiceId(undefined);
    }
  }

  function handleKaspiDone() {
    // After successful Kaspi payment — close dialog and refresh
    onOpenChange(false);
  }

  // Handle non-kaspi portion after Kaspi is paid
  const nonKaspiLines = lines.filter((l) => l.method !== "kaspi");
  const hasNonKaspiLines = nonKaspiLines.length > 0 && nonKaspiLines.some((l) => parseFloat(l.amount) > 0);

  async function handleNonKaspiSubmitAfterKaspi() {
    if (hasNonKaspiLines) {
      await onSubmit(nonKaspiLines.map((l) => ({ method: l.method, amount: parseFloat(l.amount) })));
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0">
          {/* ── Step: Waiting for Kaspi ── */}
          {kaspiStep === "waiting" && (
            <>
              <DialogHeader className="px-6 py-4 border-b border-gray-100">
                <DialogTitle className="text-base">
                  Ожидание оплаты
                </DialogTitle>
              </DialogHeader>
              <div className="px-6 py-8 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-[#F14635] animate-spin" />
                </div>
                <p className="text-sm text-gray-700 text-center font-medium">
                  Ожидаем подтверждение клиента в приложении Kaspi
                </p>
                <div className="text-center space-y-1">
                  <p className="text-lg font-semibold tabular-nums">
                    {kaspiAmount.toLocaleString("ru-RU")} ₸
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatKaspiPhone(stripPhone(kaspiPhone))}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Счёт действителен 60 минут
                </p>
              </div>
              <DialogFooter className="px-6 py-4 border-t border-gray-100">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleCancelKaspi}
                  isLoading={cancelKaspi.isPending}
                  loadingText="Отменить счёт"
                >
                  Отменить счёт
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ── Step: Result ── */}
          {kaspiStep === "result" && (
            <>
              <DialogHeader className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <DialogTitle className="text-base">
                  Оплата
                </DialogTitle>
                <DialogClose className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </DialogClose>
              </DialogHeader>
              <div className="px-6 py-8 flex flex-col items-center gap-4">
                {kaspiStatus?.status === "paid" ? (
                  <>
                    <CheckCircle2 className="w-14 h-14 text-green-500" />
                    <p className="text-base font-semibold text-gray-900">Оплачено</p>
                    <p className="text-sm text-gray-500">
                      {kaspiAmount.toLocaleString("ru-RU")} ₸ через Kaspi Pay
                    </p>
                    {kaspiStatus.clientName && (
                      <p className="text-xs text-gray-400">{kaspiStatus.clientName}</p>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="w-14 h-14 text-red-400" />
                    <p className="text-base font-semibold text-gray-900">
                      {kaspiStatus?.status === "expired" ? "Счёт истёк" : "Счёт отменён"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Клиент не подтвердил оплату
                    </p>
                  </>
                )}
              </div>
              <DialogFooter className="px-6 py-4 border-t border-gray-100">
                {kaspiStatus?.status === "paid" ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={hasNonKaspiLines ? handleNonKaspiSubmitAfterKaspi : handleKaspiDone}
                  >
                    Готово
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setKaspiStep("form");
                      setKaspiInvoiceId(undefined);
                    }}
                  >
                    Попробовать снова
                  </Button>
                )}
              </DialogFooter>
            </>
          )}

          {/* ── Step: Form (default) ── */}
          {kaspiStep === "form" && (
            <>
              {/* Header */}
              <DialogHeader className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <DialogTitle className="text-base">
                  Оплата
                </DialogTitle>
                <DialogClose className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </DialogClose>
              </DialogHeader>
              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Total to pay (only when no prepayment) */}
                {!(prepaidAmount != null && prepaidAmount > 0) && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-500">К оплате</span>
                    <span className="text-xl font-semibold text-gray-900 tabular-nums">
                      {totalPrice.toLocaleString("ru-RU")} ₸
                    </span>
                  </div>
                )}

                {/* Payment lines */}
                <div className="space-y-5">
                  {lines.map((line, i) => (
                    <div key={i} className="space-y-2.5">
                      {/* Method toggle pills */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-1 rounded-lg border border-gray-200 p-0.5 gap-0.5">
                          {METHOD_OPTIONS.filter((opt) => !allowedMethods || allowedMethods.includes(opt.value)).map((opt) => {
                            const Icon = opt.icon;
                            const isActive = line.method === opt.value && activeTab !== "skip";
                            const styles = METHOD_STYLES[opt.value];
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => { setActiveTab("prepayment"); updateLine(i, "method", opt.value); }}
                                className={cn(
                                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors",
                                  isActive ? styles.active : styles.inactive
                                )}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {opt.label}
                              </button>
                            );
                          })}
                          {onSkipPrepayment && (
                            <button
                              type="button"
                              onClick={() => setActiveTab("skip")}
                              className={cn(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors",
                                activeTab === "skip"
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              Без предоплаты
                            </button>
                          )}
                        </div>
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(i)}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {activeTab !== "skip" && (
                        <>
                          {/* Phone + Amount row */}
                          <div className={cn("mt-5 flex gap-2", !line.method || line.method !== "kaspi" ? "mt-0" : "")}>
                            {line.method === "kaspi" && (
                              <div className="flex-1 min-w-0">
                                <input
                                  type="tel"
                                  value={kaspiPhone}
                                  onChange={(e) => setKaspiPhone(formatKaspiPhone(e.target.value))}
                                  placeholder="8 (7XX) XXX-XX-XX"
                                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#F14635] focus:ring-1 focus:ring-[#F14635] tabular-nums"
                                />
                              </div>
                            )}
                            <div className={cn("relative", line.method === "kaspi" ? "flex-1 min-w-0" : "w-full")}>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={line.amount}
                                onChange={(e) => updateLine(i, "amount", e.target.value)}
                                placeholder="0"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tabular-nums"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">₸</span>
                            </div>
                          </div>
                          {line.method === "kaspi" && (
                            <p className="text-xs text-gray-400 -mt-1.5">
                              На этот номер придёт уведомление в Kaspi
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Skip prepayment content */}
                {activeTab === "skip" && onSkipPrepayment && (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-5 space-y-2 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      Создать запись без предоплаты
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Запись будет сразу подтверждена без ожидания оплаты.
                      Используйте для постоянных клиентов, которым вы доверяете.
                    </p>
                  </div>
                )}

                {/* Add method button */}
                {activeTab !== "skip" && (
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить способ
                  </button>
                )}

                {/* Prepayment breakdown */}
                {prepaidAmount != null && prepaidAmount > 0 && (
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-3 space-y-1.5">
                    <div className="flex justify-between items-baseline text-sm text-gray-500">
                      <span>Стоимость услуги</span>
                      <span className="tabular-nums">{(totalPrice + prepaidAmount).toLocaleString("ru-RU")} ₸</span>
                    </div>
                    <div className="flex justify-between items-baseline text-sm text-gray-500">
                      <span>Предоплата внесена</span>
                      <span className="tabular-nums">−{prepaidAmount.toLocaleString("ru-RU")} ₸</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline">
                      <span className="text-sm font-semibold text-gray-900">К оплате</span>
                      <span className="text-lg font-bold text-gray-900 tabular-nums">
                        {totalPrice.toLocaleString("ru-RU")} ₸
                      </span>
                    </div>
                  </div>
                )}

                {/* Diff indicator — only show when underpaid */}
                {diff > 0.01 && (
                  <div className="text-sm px-3 py-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                    Не хватает: {diff.toLocaleString("ru-RU")} ₸
                  </div>
                )}

                {/* Kaspi error */}
                {createKaspi.isError && (
                  <div className="text-sm px-3 py-2.5 rounded-lg bg-red-50 text-red-700 border border-red-100">
                    {createKaspi.error.message.startsWith("ALREADY_EXISTS")
                      ? "Уже есть активный счёт для этой записи"
                      : createKaspi.error.message}
                  </div>
                )}
              </div>

              {/* Footer */}
              <DialogFooter className="flex-row gap-3 px-6 py-4 border-t border-gray-100">
                <DialogClose asChild>
                  <Button variant="secondary" className="flex-1">
                    Отмена
                  </Button>
                </DialogClose>
                {activeTab === "skip" && onSkipPrepayment ? (
                  <Button
                    className="flex-1 bg-gray-900 hover:bg-gray-800 border-transparent"
                    onClick={onSkipPrepayment}
                  >
                    Создать запись
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-gray-900 hover:bg-gray-800 border-transparent"
                    onClick={handleSubmit}
                    disabled={
                      !isValid ||
                      isPending ||
                      createKaspi.isPending ||
                      (hasKaspiLine && !isKaspiPhoneValid)
                    }
                    isLoading={isPending || createKaspi.isPending}
                    loadingText={hasKaspiLine ? "Выставить счёт" : onSkipPrepayment ? "Принять предоплату" : "Принять оплату"}
                  >
                    {hasKaspiLine ? "Выставить счёт" : onSkipPrepayment ? "Принять предоплату" : "Принять оплату"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
