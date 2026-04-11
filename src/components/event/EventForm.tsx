"use client";

import { useTranslations } from "next-intl";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useEvents";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TextInput, Button, DatePicker, Select, SelectItem } from "@tremor/react";
import { ru } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import {
  RiMapPinLine,
  RiHashtag,
  RiCameraLine,
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
      faceSearchEnabled?: boolean;
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
  const [location, setLocation] = useState(event?.location || "");
  const [pricingMode] = useState(event?.pricingMode || "commission");
  const [faceSearchEnabled, setFaceSearchEnabled] = useState(event?.settings?.faceSearchEnabled !== false);
  const [bibSearchEnabled, setBibSearchEnabled] = useState(event?.settings?.bibSearchEnabled ?? false);

  function generateRandomSlug() {
    return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const data = {
      title,
      slug: event?.slug || generateRandomSlug(),
      date: eventDate ? eventDate.toISOString() : undefined,
      location: location || undefined,
      pricingMode: pricingMode as "exclusive" | "commission",
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
      {/* Section 1: Basic Info + Date & Location */}
      <section className="rounded-xl bg-bg-secondary p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Section 2: Settings */}
      <section className="rounded-xl bg-bg-secondary p-5">
        <div className="space-y-4">
          {/* Face Search Toggle */}
          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white">
            <div className="flex items-center gap-3">
              <RiCameraLine className="w-4.5 h-4.5 text-text-secondary" />
              <div>
                <span className="text-sm font-medium text-text">{t("face_search")}</span>
                <p className="text-xs text-text-secondary">{t("face_search_hint")}</p>
              </div>
            </div>
            <Switch checked={faceSearchEnabled} onChange={setFaceSearchEnabled} />
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
