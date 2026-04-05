"use client";

import { useTranslations } from "next-intl";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useEvents";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TextInput, NumberInput, Textarea, Button, Switch } from "@tremor/react";

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
  const [date, setDate] = useState(
    event?.date ? new Date(event.date).toISOString().slice(0, 16) : ""
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
      date: date || undefined,
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

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("event_name")} *
        </label>
        <TextInput
          name="title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!isEdit) setSlug(generateSlug(e.target.value));
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("slug")} *</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">/e/</span>
          <TextInput
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <p className="text-xs text-text-secondary mt-1">{t("slug_hint")}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("event_description")}
        </label>
        <Textarea
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("event_date")}
          </label>
          <input
            name="date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="tremor-TextInput-input w-full rounded-tremor-default border border-tremor-border bg-tremor-background px-3 py-2 text-tremor-default text-tremor-content-emphasis shadow-tremor-input focus:border-tremor-brand focus:ring-2 focus:ring-tremor-brand-muted"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("event_location")}
          </label>
          <TextInput
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t("pricing_mode")}
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pricingMode"
              value="commission"
              checked={pricingMode === "commission"}
              onChange={() => setPricingMode("commission")}
            />
            <span className="text-sm">{t("commission")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pricingMode"
              value="exclusive"
              checked={pricingMode === "exclusive"}
              onChange={() => setPricingMode("exclusive")}
            />
            <span className="text-sm">{t("exclusive")}</span>
          </label>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="font-medium mb-3">{t("settings")}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={freeDownload}
              onChange={setFreeDownload}
            />
            <span className="text-sm">{t("free_download")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={watermarkEnabled}
              onChange={setWatermarkEnabled}
            />
            <span className="text-sm">{t("watermark")}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">
                {t("price_per_photo")}
              </label>
              <NumberInput
                name="pricePerPhoto"
                min={0}
                value={pricePerPhoto}
                onValueChange={setPricePerPhoto}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                {t("package_discount")}
              </label>
              <NumberInput
                name="packageDiscount"
                min={0}
                max={100}
                value={packageDiscount}
                onValueChange={setPackageDiscount}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending
            ? "..."
            : isEdit
              ? tc("save")
              : tc("create")}
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
