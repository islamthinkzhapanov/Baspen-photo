"use client";

import { useTranslations } from "next-intl";
import {
  RiImageLine,
  RiCalendarLine,
  RiHardDriveLine,
} from "@remixicon/react";
import { Button } from "@tremor/react";

// --- Demo data ---

const currentPlan = {
  name: "Pro",
  priceMonthly: 9900,
  maxEvents: 20,
  maxPhotosPerEvent: 50000,
  maxStorageGb: 100,
  currentPeriodEnd: "2026-05-01",
  usedEvents: 5,
  usedPhotos: 12480,
  usedStorageGb: 34,
};

const eventPackages = [
  { photos: "2 500", price: "200 000", perPhoto: "80" },
  { photos: "5 000", price: "250 000", perPhoto: "50" },
  { photos: "7 500", price: "300 000", perPhoto: "40", popular: true },
  { photos: "15 000", price: "400 000", perPhoto: "27" },
  { photos: "15 001+", price: "500 000", perPhoto: "~33" },
];

// --- Component ---

export function BillingPage() {
  const t = useTranslations("billing");

  const usageItems = [
    {
      icon: RiImageLine,
      label: t("limit_photos", { count: currentPlan.maxPhotosPerEvent.toLocaleString("ru-RU") }),
      used: currentPlan.usedPhotos,
      max: currentPlan.maxPhotosPerEvent,
    },
    {
      icon: RiCalendarLine,
      label: t("limit_events", { count: currentPlan.maxEvents }),
      used: currentPlan.usedEvents,
      max: currentPlan.maxEvents,
    },
    {
      icon: RiHardDriveLine,
      label: t("limit_storage", { gb: currentPlan.maxStorageGb }),
      used: currentPlan.usedStorageGb,
      max: currentPlan.maxStorageGb,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("valid_until", {
            date: new Date(currentPlan.currentPeriodEnd).toLocaleDateString("ru-RU"),
          })}
        </p>
      </div>

      {/* Current Plan */}
      <div className="border border-border rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-border">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary mb-1">{t("current_plan")}</p>
            <p className="text-2xl font-bold">{currentPlan.name}</p>
            <p className="text-sm text-text-secondary mt-0.5">
              {currentPlan.priceMonthly.toLocaleString("ru-RU")} {t("kzt_month")}
            </p>
          </div>
          <button className="text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg px-4 py-2 transition-colors w-fit">
            {t("cancel_subscription")}
          </button>
        </div>

        {/* Usage */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {usageItems.map((item) => {
            const Icon = item.icon;
            const percent = Math.round((item.used / item.max) * 100);
            return (
              <div key={item.label} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={15} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-2.5">
                  <span className="text-xl font-semibold tabular-nums">{item.used.toLocaleString("ru-RU")}</span>
                  <span className="text-xs text-text-secondary">/ {item.max.toLocaleString("ru-RU")}</span>
                </div>
                <div className="w-full h-1 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-text-primary/20 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Photo Packages */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Пакеты фотографий</h2>
        <p className="text-sm text-text-secondary mb-5">
          Разовая покупка — выберите нужный объём фото для мероприятия
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {eventPackages.map((pkg, i) => (
            <div
              key={i}
              className={`relative flex flex-col items-center rounded-xl border p-5 text-center transition-shadow hover:shadow-md cursor-pointer ${
                pkg.popular
                  ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                  : "border-border"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Выгодный
                </span>
              )}

              <p className="text-xs text-text-secondary mb-1">до</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">{pkg.photos}</p>
              <p className="text-xs text-text-secondary mb-4">фото</p>

              <p className="text-lg font-semibold tabular-nums">{pkg.price} ₸</p>
              <p className="text-[11px] text-text-secondary mt-0.5 mb-4">
                ~{pkg.perPhoto} ₸ / фото
              </p>

              <Button
                className="w-full"
                variant={pkg.popular ? "primary" : "secondary"}
              >
                Купить
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
