"use client";

import { useTranslations } from "next-intl";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useEvents";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TextInput, NumberInput, Textarea, Button, DatePicker } from "@tremor/react";
import { ru } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import {
  RiMapPinLine,
  RiPercentLine,
  RiImageLine,
  RiDownloadLine,
  RiDropLine,
  RiArrowLeftLine,
  RiInformationLine,
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

  const [slug, setSlug] = useState(event?.slug || "");
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [eventDate, setEventDate] = useState<Date | undefined>(
    event?.date ? new Date(event.date) : undefined
  );
  const [eventTime, setEventTime] = useState(
    event?.date ? new Date(event.date).toISOString().slice(11, 16) : ""
  );
  const [location, setLocation] = useState(event?.location || "");
  const [pricingMode, setPricingMode] = useState(event?.pricingMode || "commission");
  const [freeDownload, setFreeDownload] = useState(event?.settings?.freeDownload ?? false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(event?.settings?.watermarkEnabled ?? true);
  const [pricePerPhoto, setPricePerPhoto] = useState(event?.settings?.pricePerPhoto || 0);
  const [packageDiscount, setPackageDiscount] = useState(event?.settings?.packageDiscount || 0);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 100);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const data = {
      title,
      slug,
      description: description || undefined,
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
        watermarkEnabled,
        pricePerPhoto,
        packageDiscount,
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
            onChange={(e) => {
              setTitle(e.target.value);
              if (!isEdit) setSlug(generateSlug(e.target.value));
            }}
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-text mb-1.5">
            {t("slug")} <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-tremor-default border border-r-0 border-tremor-border bg-tremor-background-subtle text-sm text-text-secondary select-none">
              /e/
            </span>
            <div className="flex-1 [&_.tremor-TextInput-root]:rounded-l-none">
              <TextInput
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text mb-1.5">
            {t("event_description")}
          </label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder={t("event_description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      {/* Section 2: Date & Location */}
      <section className="rounded-xl bg-bg-secondary p-5">
        <div className="grid grid-cols-[1fr_auto_1.5fr] gap-3 items-end">
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

      {/* Section 3: Pricing Model */}
      <section className="rounded-xl bg-bg-secondary p-5">
        <label className="block text-sm font-medium text-text mb-3">
          {t("pricing_mode")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPricingMode("commission")}
            className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all cursor-pointer ${
              pricingMode === "commission"
                ? "border-primary bg-blue-50/60 shadow-sm"
                : "border-border hover:border-border-active bg-white"
            }`}
          >
            <RiPercentLine className={`w-6 h-6 ${pricingMode === "commission" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-sm font-medium ${pricingMode === "commission" ? "text-primary" : "text-text"}`}>
              {t("commission")}
            </span>
            <span className={`text-xs leading-relaxed ${pricingMode === "commission" ? "text-primary/70" : "text-text-secondary"}`}>
              {t("commission_desc")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPricingMode("exclusive")}
            className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all cursor-pointer ${
              pricingMode === "exclusive"
                ? "border-primary bg-blue-50/60 shadow-sm"
                : "border-border hover:border-border-active bg-white"
            }`}
          >
            <RiImageLine className={`w-6 h-6 ${pricingMode === "exclusive" ? "text-primary" : "text-text-secondary"}`} />
            <span className={`text-sm font-medium ${pricingMode === "exclusive" ? "text-primary" : "text-text"}`}>
              {t("exclusive")}
            </span>
            <span className={`text-xs leading-relaxed ${pricingMode === "exclusive" ? "text-primary/70" : "text-text-secondary"}`}>
              {t("exclusive_desc")}
            </span>
          </button>
        </div>

        {/* Pricing terms info */}
        <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-100 px-3.5 py-2.5">
          <RiInformationLine className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span className="text-xs text-primary/80 leading-relaxed">
            {pricingMode === "commission" ? t("commission_terms") : t("exclusive_terms")}
          </span>
        </div>
      </section>

      {/* Section 4: Settings */}
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

          {/* Watermark Toggle */}
          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white">
            <div className="flex items-center gap-3">
              <RiDropLine className="w-4.5 h-4.5 text-text-secondary" />
              <span className="text-sm font-medium text-text">{t("watermark")}</span>
            </div>
            <Switch checked={watermarkEnabled} onChange={setWatermarkEnabled} />
          </div>

          {/* Pricing fields — only relevant when not free */}
          {!freeDownload && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
