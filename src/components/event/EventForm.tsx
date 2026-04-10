"use client";

import { useTranslations } from "next-intl";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useEvents";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TextInput, NumberInput, Button, DatePicker, Select, SelectItem } from "@tremor/react";
import { ru } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import {
  RiMapPinLine,
  RiDownloadLine,
  RiDropLine,
  RiShoppingCartLine,
  RiHashtag,
  RiCameraLine,
  RiGridLine,
} from "@remixicon/react";

interface EventFormProps {
  event?: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    date?: string | null;
    location?: string | null;
    pricingMode: string;
    settings?: {
      freeDownload?: boolean;
      watermarkEnabled?: boolean;
      pricePerPhoto?: number;
      packageDiscount?: number;
      bibSearchEnabled?: boolean;
      displayMode?: "search" | "gallery";
      retentionMonths?: number;
    } | null;
  };
}

export function EventForm({ event }: EventFormProps) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const router = useRouter();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent(event?.id || "");
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title || "");
  const [retentionMonths, setRetentionMonths] = useState(event?.settings?.retentionMonths ?? 12);
  const [eventDate, setEventDate] = useState<Date | undefined>(
    event?.date ? new Date(event.date) : undefined
  );
  const [eventTime, setEventTime] = useState(
    event?.date ? new Date(event.date).toISOString().slice(11, 16) : ""
  );
  const [location, setLocation] = useState(event?.location || "");
  const [pricingMode] = useState(event?.pricingMode || "commission");
  const [freeDownload, setFreeDownload] = useState(event?.settings?.freeDownload ?? false);
  const [photoSalesEnabled, setPhotoSalesEnabled] = useState(
    (event?.settings?.pricePerPhoto ?? 0) > 0 || event?.settings?.watermarkEnabled === true
  );
  const [watermarkEnabled, setWatermarkEnabled] = useState(event?.settings?.watermarkEnabled ?? true);
  const [pricePerPhoto, setPricePerPhoto] = useState(event?.settings?.pricePerPhoto || 0);
  const [packageDiscount, setPackageDiscount] = useState(event?.settings?.packageDiscount || 0);
  const [bibSearchEnabled, setBibSearchEnabled] = useState(event?.settings?.bibSearchEnabled ?? false);
  const [displayMode, setDisplayMode] = useState<"search" | "gallery">(event?.settings?.displayMode ?? "search");

  function generateRandomSlug() {
    return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const data = {
      title,
      slug: event?.slug || generateRandomSlug(),
      date: eventDate
        ? (() => {
            const d = new Date(eventDate);
            if (eventTime) {
              const [h, m] = eventTime.split(":");
              d.setHours(Number(h), Number(m), 0, 0);
            }
            return d.toISOString();
          })()
        : undefined,
      location: location || undefined,
      pricingMode: pricingMode as "exclusive" | "commission",
      settings: {
        freeDownload,
        watermarkEnabled: photoSalesEnabled ? watermarkEnabled : false,
        pricePerPhoto: photoSalesEnabled ? pricePerPhoto : 0,
        packageDiscount: photoSalesEnabled ? packageDiscount : 0,
        bibSearchEnabled,
        displayMode,
        retentionMonths,
      },
    };

    const mutation = isEdit ? updateMutation : createMutation;

    mutation.mutate(data, {
      onSuccess: (result: { id: string }) => {
        toast.success(tc("success"));
        router.push(`/events/${result.id}`);
      },
      onError: (err: Error) => {
        toast.error(err.message);
      },
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 pb-8">
      {/* Section 0: Display Mode */}
      <section className="rounded-xl bg-bg-secondary p-5">
        <label className="block text-sm font-medium text-text mb-3">
          {t("display_mode")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDisplayMode("search")}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
              displayMode === "search"
                ? "border-primary bg-primary/5"
                : "border-border bg-white hover:border-primary/30"
            }`}
          >
            <RiCameraLine className={`w-6 h-6 ${displayMode === "search" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-sm font-medium ${displayMode === "search" ? "text-primary" : "text-text"}`}>
              {t("display_mode_search")}
            </span>
            <span className="text-xs text-text-secondary text-center">
              {t("display_mode_search_desc")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode("gallery")}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
              displayMode === "gallery"
                ? "border-primary bg-primary/5"
                : "border-border bg-white hover:border-primary/30"
            }`}
          >
            <RiGridLine className={`w-6 h-6 ${displayMode === "gallery" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-sm font-medium ${displayMode === "gallery" ? "text-primary" : "text-text"}`}>
              {t("display_mode_gallery")}
            </span>
            <span className="text-xs text-text-secondary text-center">
              {t("display_mode_gallery_desc")}
            </span>
          </button>
        </div>
      </section>

      {/* Section 1: Basic Info */}
      <section className="rounded-xl bg-bg-secondary p-5 space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text mb-1.5">
            {t("event_name")} <span className="text-red-500">*</span>
          </label>
          <TextInput
            id="title"
            name="title"
            placeholder={t("event_name")}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            {t("retention_period")}
          </label>
          <Select
            value={String(retentionMonths)}
            onValueChange={(val) => setRetentionMonths(Number(val))}
            enableClear={false}
          >
            <SelectItem value="1">1 мес</SelectItem>
            <SelectItem value="6">6 мес</SelectItem>
            <SelectItem value="12">12 мес</SelectItem>
          </Select>
        </div>
      </section>

      {/* Section 2: Date & Location */}
      <section className="rounded-xl bg-bg-secondary p-5">
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                &nbsp;
              </label>
              <TimePicker
                value={eventTime}
                onChange={setEventTime}
              />
            </div>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-text mb-1.5">
              {t("event_location")}
            </label>
            <TextInput
              id="location"
              name="location"
              icon={RiMapPinLine}
              placeholder={t("event_location")}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Section 3: Settings */}
      <section className="rounded-xl bg-bg-secondary p-5">
        <div className="space-y-4">
          {/* Free Download Toggle */}
          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white">
            <div className="flex items-center gap-3">
              <RiDownloadLine className="w-4.5 h-4.5 text-text-secondary" />
              <span className="text-sm font-medium text-text">{t("free_download")}</span>
            </div>
            <Switch checked={freeDownload} onChange={setFreeDownload} />
          </div>

          {/* Bib Number Search Toggle */}
          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white">
            <div className="flex items-center gap-3">
              <RiHashtag className="w-4.5 h-4.5 text-text-secondary" />
              <div>
                <span className="text-sm font-medium text-text">{t("bib_search")}</span>
                <p className="text-xs text-text-secondary">{t("bib_search_hint")}</p>
              </div>
            </div>
            <Switch checked={bibSearchEnabled} onChange={setBibSearchEnabled} />
          </div>

          {/* Photo Sales Toggle */}
          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white">
            <div className="flex items-center gap-3">
              <RiShoppingCartLine className="w-4.5 h-4.5 text-text-secondary" />
              <span className="text-sm font-medium text-text">{t("photo_sales")}</span>
            </div>
            <Switch checked={photoSalesEnabled} onChange={setPhotoSalesEnabled} />
          </div>

          {/* Watermark + Pricing — only when photo sales enabled */}
          {photoSalesEnabled && (
            <div className="space-y-4 pl-3 border-l-2 border-primary/20">
              {/* Watermark Toggle */}
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <RiDropLine className="w-4.5 h-4.5 text-text-secondary" />
                  <span className="text-sm font-medium text-text">{t("watermark")}</span>
                </div>
                <Switch checked={watermarkEnabled} onChange={setWatermarkEnabled} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pricePerPhoto" className="block text-sm font-medium text-text mb-1.5">
                    {t("price_per_photo")}
                  </label>
                  <NumberInput
                    id="pricePerPhoto"
                    name="pricePerPhoto"
                    min={0}
                    value={pricePerPhoto}
                    onValueChange={setPricePerPhoto}
                  />
                </div>
                <div>
                  <label htmlFor="packageDiscount" className="block text-sm font-medium text-text mb-1.5">
                    {t("package_discount")}
                  </label>
                  <NumberInput
                    id="packageDiscount"
                    name="packageDiscount"
                    min={0}
                    max={100}
                    value={packageDiscount}
                    onValueChange={setPackageDiscount}
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    {t("package_discount_hint")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="min-w-[140px]"
        >
          {isPending ? "..." : isEdit ? tc("save") : tc("create")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          {tc("cancel")}
        </Button>
      </div>
    </form>
  );
}
