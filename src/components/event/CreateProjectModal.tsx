"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  DatePicker,
  Select,
  SelectItem,
  TextInput,
} from "@tremor/react";
import { ru } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useEvents";
import { useRouter } from "@/i18n/navigation";
import type { Event } from "@/types/api";
import {
  RiCloseLine,
  RiMapPinLine,
  RiCameraLine,
  RiLoader4Line,
  RiUserLine,
  RiSmartphoneLine,
  RiBriefcaseLine,
  RiTimeLine,
  RiCheckLine,
  RiCloseFill,
  RiArrowRightLine,
} from "@remixicon/react";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date;
  defaultTime?: string;
  editEvent?: Event | null;
}

/* ── Consistent height class for all Tremor inputs/selects ── */
const inputClassName =
  "[&>input]:!h-[42px] [&>input]:!text-[15px]";
const selectClassName =
  "[&_button]:!h-[42px] [&_button]:!text-[15px]";
const datePickerClassName =
  "!h-[42px] [&_button]:!h-[42px] [&_button]:!text-[15px]";

/* ── Phone formatting (from ProfilePage) ── */
function formatPhone(d: string) {
  let r = "+7";
  if (d.length > 0) r += ` (${d.slice(0, 3)}`;
  if (d.length >= 3) r += `) ${d.slice(3, 6)}`;
  if (d.length >= 6) r += `-${d.slice(6, 8)}`;
  if (d.length >= 8) r += `-${d.slice(8, 10)}`;
  return r;
}

function extractDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("7") && digits.length > 1) return digits.slice(1);
  if (digits.startsWith("8") && digits.length > 1) return digits.slice(1);
  return digits;
}

/* ── Main component ── */
export function CreateProjectModal({ open, onClose, defaultDate, defaultTime, editEvent }: CreateProjectModalProps) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const tp = useTranslations("profile");
  const router = useRouter();
  const createMutation = useCreateEvent();
  const isEditMode = !!editEvent;
  const updateMutation = useUpdateEvent(editEvent?.id ?? "");

  type Tab = "basic" | "card";
  const [tab, setTab] = useState<Tab>("basic");

  // Basic tab state
  const [title, setTitle] = useState("");
  const [retentionMonths, setRetentionMonths] = useState(12);
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [location, setLocation] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState<string>("");

  // Business card tab state
  const [cardEnabled, setCardEnabled] = useState(true);
  const [cardName, setCardName] = useState("");
  const [cardPhoneDigits, setCardPhoneDigits] = useState("");
  const [cardOccupation, setCardOccupation] = useState("");
  const [cardAvatarUrl, setCardAvatarUrl] = useState("");
  const [cardAvatarUploading, setCardAvatarUploading] = useState(false);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load profile data for business card tab (only in create mode)
  useEffect(() => {
    if (!open || profileLoaded || isEditMode) return;
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (data.name) setCardName(data.name);
          if (data.phone) setCardPhoneDigits(extractDigits(data.phone));
          if (data.occupation) setCardOccupation(data.occupation);
          if (data.image) setCardAvatarUrl(data.image);
          setProfileLoaded(true);
        }
      })
      .catch(() => {});
  }, [open, profileLoaded, isEditMode]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setTab("basic");

      if (editEvent) {
        // Edit mode: pre-fill from event
        setTitle(editEvent.title);
        setRetentionMonths(editEvent.settings?.retentionMonths ?? 12);
        setEventDate(editEvent.date ? new Date(editEvent.date) : undefined);
        setEventTime(editEvent.eventTime ?? "");
        setLocation(editEvent.location ?? "");
        setNotes(editEvent.description ?? "");
        setPrice(editEvent.price != null ? String(editEvent.price) : "");
      } else {
        // Create mode: reset
        setTitle("");
        setRetentionMonths(12);
        setEventDate(defaultDate ?? undefined);
        setEventTime(defaultTime ?? "");
        setLocation("");
        setNotes("");
        setPrice("");
        setCardEnabled(true);
        setProfileLoaded(false);
      }
    }
  }, [open, defaultDate, defaultTime, editEvent]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(tp("avatar_too_large"));
      return;
    }
    setCardAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setCardAvatarUrl(url);
    } catch {
      toast.error(tp("avatar_error"));
    } finally {
      setCardAvatarUploading(false);
      if (cardFileRef.current) cardFileRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error(t("event_name"));
      return;
    }

    if (isEditMode) {
      // Edit mode: save changes
      updateMutation.mutate(
        {
          title,
          date: eventDate ? eventDate.toISOString() : undefined,
          description: notes || undefined,
          price: price ? Number(price) : undefined,
          location: location || undefined,
          eventTime: eventTime || undefined,
          settings: {
            retentionMonths,
          },
        },
        {
          onSuccess: () => {
            toast.success(tc("success"));
            onClose();
          },
          onError: (err: Error) => {
            toast.error(err.message);
          },
        }
      );
      return;
    }

    // Create mode
    // Save profile changes if card is enabled
    if (cardEnabled) {
      try {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cardName || undefined,
            phone: cardPhoneDigits ? formatPhone(cardPhoneDigits) : undefined,
            occupation: cardOccupation || undefined,
          }),
        });
      } catch {
        // non-critical, continue with project creation
      }
    }

    const slug = `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    createMutation.mutate(
      {
        title,
        slug,
        date: eventDate ? eventDate.toISOString() : undefined,
        description: notes || undefined,
        price: price ? Number(price) : undefined,
        location: location || undefined,
        eventTime: eventTime || undefined,
        pricingMode: "commission" as const,
        settings: {
          freeDownload: true,
          watermarkEnabled: false,
          pricePerPhoto: 0,
          packageDiscount: 0,
          bibSearchEnabled: false,
          faceSearchEnabled: true,
          displayMode: "gallery" as const,
          retentionMonths,
        },
      },
      {
        onSuccess: () => {
          toast.success(tc("success"));
          onClose();
        },
        onError: (err: Error) => {
          toast.error(err.message);
        },
      }
    );
  }

  function handleStatusChange(status: "completed" | "cancelled") {
    if (!editEvent) return;
    updateMutation.mutate(
      { status },
      {
        onSuccess: () => {
          toast.success(tc("success"));
          onClose();
        },
        onError: (err: Error) => {
          toast.error(err.message);
        },
      }
    );
  }

  if (!open) return null;

  const isBasic = tab === "basic";
  const isCard = tab === "card";
  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fade-in_200ms_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[560px] max-h-[90vh] animate-[fade-in-up_300ms_ease-out] overflow-visible rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative px-7 pt-7 pb-0 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text transition-all duration-200 cursor-pointer"
          >
            <RiCloseLine size={20} />
          </button>

          <h2 className="text-[22px] font-bold tracking-tight text-text">
            {isEditMode ? editEvent!.title : t("create_project")}
          </h2>
          {!isEditMode && (
            <p className="mt-1 text-[14px] text-text-secondary">
              {t("new_event_desc")}
            </p>
          )}
        </div>

        {/* Pill tabs — only in create mode */}
        {!isEditMode && (
          <div className="mx-7 mt-5 flex rounded-lg bg-bg-secondary p-1 shrink-0">
            <button
              onClick={() => setTab("basic")}
              className={`flex-1 rounded-md py-2 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                isBasic
                  ? "bg-white text-text shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {t("tab_basic")}
            </button>
            <button
              onClick={() => setTab("card")}
              className={`flex-1 rounded-md py-2 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                isCard
                  ? "bg-white text-text shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {t("tab_business_card")}
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className={`px-7 ${isEditMode ? "pt-5" : "pt-5"} pb-7 overflow-y-auto flex-1`}>
          {/* ── Basic Tab ── */}
          {isBasic && (
            <div className="space-y-5">
              {/* Name + Retention */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-text mb-1.5">
                    {t("event_name")} <span className="text-red-500">*</span>
                  </label>
                  <TextInput
                    placeholder={t("event_name")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-text mb-1.5">
                      {t("retention_period")}
                    </label>
                    <Select
                      value={String(retentionMonths)}
                      onValueChange={(val) => setRetentionMonths(Number(val))}
                      enableClear={false}
                      icon={RiTimeLine}
                      className={selectClassName}
                    >
                      <SelectItem value="1">1 мес</SelectItem>
                      <SelectItem value="6">6 мес</SelectItem>
                      <SelectItem value="12">12 мес</SelectItem>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-text mb-1.5">
                      Сумма
                    </label>
                    <TextInput
                      placeholder="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                      className={inputClassName}
                      type="text"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-text mb-1.5">
                    {t("event_date")}
                  </label>
                  <DatePicker
                    value={eventDate}
                    onValueChange={setEventDate}
                    placeholder="дд.мм.гггг"
                    displayFormat="dd.MM.yyyy"
                    locale={ru}
                    enableClear={true}
                    enableYearNavigation
                    weekStartsOn={1}
                    className={datePickerClassName}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text mb-1.5">
                    Время
                  </label>
                  <Select
                    value={eventTime}
                    onValueChange={setEventTime}
                    placeholder="Время"
                    enableClear={true}
                    icon={RiTimeLine}
                    className={selectClassName}
                  >
                    {Array.from({ length: 48 }, (_, i) => {
                      const h = String(Math.floor(i / 2)).padStart(2, "0");
                      const m = i % 2 === 0 ? "00" : "30";
                      return (
                        <SelectItem key={i} value={`${h}:${m}`}>
                          {h}:{m}
                        </SelectItem>
                      );
                    })}
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[13px] font-medium text-text mb-1.5">
                  {t("event_location")}
                </label>
                <TextInput
                  icon={RiMapPinLine}
                  placeholder="Город / Адрес"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClassName}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[13px] font-medium text-text mb-1.5">
                  Заметки
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Необязательно"
                  rows={3}
                  className="w-full rounded-xl border border-tremor-border bg-white px-3 py-2.5 text-[15px] text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Business Card Tab (create mode only) ── */}
          {isCard && !isEditMode && (
            <div className="space-y-5">
              {/* Enable switch */}
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-bg-secondary">
                <span className="text-sm font-medium text-text">
                  {t("business_card_enabled")}
                </span>
                <Switch checked={cardEnabled} onChange={setCardEnabled} />
              </div>

              {cardEnabled && (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary">
                    {t("pull_from_profile")}
                  </p>

                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => cardFileRef.current?.click()}
                      className="relative w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center overflow-hidden group cursor-pointer"
                    >
                      {cardAvatarUrl ? (
                        <img
                          src={cardAvatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <RiCameraLine
                          size={24}
                          className="text-text-secondary"
                        />
                      )}
                      {cardAvatarUploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <RiLoader4Line
                            size={20}
                            className="animate-spin text-primary"
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <RiCameraLine size={20} className="text-white" />
                      </div>
                    </button>
                    <div>
                      <p className="text-sm font-medium">
                        {tp("avatar_upload")}
                      </p>
                      <p className="text-xs text-text-secondary">
                        JPG, PNG · 5 МБ
                      </p>
                    </div>
                    <input
                      ref={cardFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-text">
                      {tp("name")}
                    </label>
                    <TextInput
                      icon={RiUserLine}
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder={tp("name")}
                      className={inputClassName}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-text">
                      {tp("phone")}
                    </label>
                    <TextInput
                      icon={RiSmartphoneLine}
                      value={formatPhone(cardPhoneDigits)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        const clean = digits.startsWith("7")
                          ? digits.slice(1)
                          : digits.startsWith("8")
                            ? digits.slice(1)
                            : digits;
                        setCardPhoneDigits(clean.slice(0, 10));
                      }}
                      placeholder={tp("phone_placeholder")}
                      className={inputClassName}
                    />
                  </div>

                  {/* Occupation */}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-text">
                      {tp("occupation")}
                    </label>
                    <TextInput
                      icon={RiBriefcaseLine}
                      value={cardOccupation}
                      onChange={(e) => setCardOccupation(e.target.value)}
                      placeholder={tp("occupation_placeholder")}
                      className={inputClassName}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 pt-2 shrink-0">
          {isEditMode ? (
            <div className="space-y-3">
              {/* Save changes */}
              <button
                onClick={handleSubmit}
                disabled={isPending || !title.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60 cursor-pointer"
              >
                {isPending && (
                  <RiLoader4Line size={18} className="animate-spin" />
                )}
                Сохранить
              </button>

              {/* Action buttons row */}
              <div className="flex gap-2">
                {/* More details */}
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/events/${editEvent!.id}`);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <RiArrowRightLine size={16} />
                  Подробнее
                </button>

                {/* Completed */}
                {editEvent!.status !== "completed" && (
                  <button
                    onClick={() => handleStatusChange("completed")}
                    disabled={isPending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2.5 text-[13px] font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <RiCheckLine size={16} />
                    Выполнено
                  </button>
                )}

                {/* Cancelled */}
                {editEvent!.status !== "cancelled" && (
                  <button
                    onClick={() => handleStatusChange("cancelled")}
                    disabled={isPending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <RiCloseFill size={16} />
                    Отменён
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPending || !title.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60 cursor-pointer"
            >
              {isPending && (
                <RiLoader4Line size={18} className="animate-spin" />
              )}
              {tc("create")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
