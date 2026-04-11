"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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
import { useCreateEvent } from "@/hooks/useEvents";
import {
  RiCloseLine,
  RiMapPinLine,
  RiHashtag,
  RiCameraLine,
  RiLoader4Line,
  RiUserLine,
  RiSmartphoneLine,
  RiBriefcaseLine,
  RiTimeLine,
  RiClockwiseLine,
} from "@remixicon/react";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

/* ── Consistent height class for all Tremor inputs/selects ── */
const inputClassName =
  "!rounded-full [&>input]:!h-[42px] [&>input]:!text-[15px]";
const selectClassName =
  "!rounded-full [&_button]:!rounded-full [&_button]:!h-[42px] [&_button]:!text-[15px]";
const datePickerClassName =
  "!rounded-full !h-[42px] [&_button]:!rounded-full [&_button]:!h-[42px] [&_button]:!text-[15px]";

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
export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const tp = useTranslations("profile");
  const router = useRouter();
  const createMutation = useCreateEvent();

  type Tab = "basic" | "card";
  const [tab, setTab] = useState<Tab>("basic");

  // Basic tab state
  const [title, setTitle] = useState("");
  const [retentionMonths, setRetentionMonths] = useState(12);
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [location, setLocation] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [faceSearchEnabled, setFaceSearchEnabled] = useState(true);
  const [bibSearchEnabled, setBibSearchEnabled] = useState(false);

  // Business card tab state
  const [cardEnabled, setCardEnabled] = useState(true);
  const [cardName, setCardName] = useState("");
  const [cardPhoneDigits, setCardPhoneDigits] = useState("");
  const [cardOccupation, setCardOccupation] = useState("");
  const [cardAvatarUrl, setCardAvatarUrl] = useState("");
  const [cardAvatarUploading, setCardAvatarUploading] = useState(false);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load profile data for business card tab
  useEffect(() => {
    if (!open || profileLoaded) return;
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
  }, [open, profileLoaded]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setTab("basic");
      setTitle("");
      setRetentionMonths(12);
      setEventDate(undefined);
      setLocation("");
      setFaceSearchEnabled(true);
      setBibSearchEnabled(false);
      setCardEnabled(true);
      setProfileLoaded(false);
    }
  }, [open]);

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
        location: location || undefined,
        eventTime: eventTime || undefined,
        pricingMode: "commission" as const,
        settings: {
          freeDownload: true,
          watermarkEnabled: false,
          pricePerPhoto: 0,
          packageDiscount: 0,
          bibSearchEnabled,
          faceSearchEnabled,
          displayMode: "gallery" as const,
          retentionMonths,
        },
      },
      {
        onSuccess: (result: { id: string }) => {
          toast.success(tc("success"));
          onClose();
          router.push(`/events/${result.id}`);
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
            {t("create_project")}
          </h2>
          <p className="mt-1 text-[14px] text-text-secondary">
            {t("new_event_desc")}
          </p>
        </div>

        {/* Pill tabs */}
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

        {/* Scrollable content */}
        <div className="px-7 pt-5 pb-7 overflow-y-auto flex-1">
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
                    icon={RiClockwiseLine}
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

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-bg-secondary">
                  <div className="flex items-center gap-3">
                    <RiCameraLine className="w-4 h-4 text-text-secondary" />
                    <div>
                      <span className="text-sm font-medium text-text">
                        {t("face_search")}
                      </span>
                      <p className="text-xs text-text-secondary">
                        {t("face_search_hint")}
                      </p>
                    </div>
                  </div>
                  <Switch checked={faceSearchEnabled} onChange={setFaceSearchEnabled} />
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-bg-secondary">
                  <div className="flex items-center gap-3">
                    <RiHashtag className="w-4 h-4 text-text-secondary" />
                    <div>
                      <span className="text-sm font-medium text-text">
                        {t("bib_search")}
                      </span>
                      <p className="text-xs text-text-secondary">
                        {t("bib_search_hint")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={bibSearchEnabled}
                    onChange={setBibSearchEnabled}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Business Card Tab ── */}
          {isCard && (
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
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !title.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60 cursor-pointer"
          >
            {createMutation.isPending && (
              <RiLoader4Line size={18} className="animate-spin" />
            )}
            {tc("create")}
          </button>
        </div>
      </div>
    </div>
  );
}
