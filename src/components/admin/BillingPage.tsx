"use client";

import { useTranslations } from "next-intl";
import {
  RiCheckLine,
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

const plans = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    maxEvents: 2,
    maxPhotosPerEvent: 500,
    maxStorageGb: 5,
    features: [
      "Базовое распознавание лиц",
      "Водяные знаки",
      "Email-поддержка",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 9900,
    maxEvents: 20,
    maxPhotosPerEvent: 50000,
    maxStorageGb: 100,
    popular: true,
    features: [
      "Приоритетное распознавание",
      "Кастомные водяные знаки",
      "Брендированные рамки",
      "Аналитика",
      "Приоритетная поддержка",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 29900,
    maxEvents: -1,
    maxPhotosPerEvent: 200000,
    maxStorageGb: 1000,
    features: [
      "Безлимит мероприятий",
      "Кастомный домен",
      "White-label виджет",
      "API-доступ",
      "SLA 99.9%",
      "Персональный менеджер",
    ],
  },
];

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
    <div className="space-y-10 max-w-5xl">
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

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-5">{t("available_plans")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentPlan.name;
            return (
              <div
                key={plan.id}
                className={`bg-bg-primary p-6 flex flex-col ${isCurrent ? "bg-bg-secondary/40" : ""}`}
              >
                {/* Plan header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-base font-semibold">{plan.name}</h3>
                    {plan.popular && (
                      <span className="text-[10px] uppercase tracking-wider font-medium text-text-secondary border border-border rounded px-1.5 py-0.5">
                        {t("popular") ?? "Популярный"}
                      </span>
                    )}
                  </div>

                  {plan.priceMonthly === 0 ? (
                    <p className="text-2xl font-bold">{t("free")}</p>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums">
                        {plan.priceMonthly.toLocaleString("ru-RU")}
                      </span>
                      <span className="text-sm text-text-secondary">{t("kzt_month")}</span>
                    </div>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-1 text-sm text-text-secondary mb-5">
                  <p>{plan.maxEvents === -1 ? "Безлимит мероприятий" : t("limit_events", { count: plan.maxEvents })}</p>
                  <p>{t("limit_photos", { count: plan.maxPhotosPerEvent.toLocaleString("ru-RU") })}</p>
                  <p>{t("limit_storage", { gb: plan.maxStorageGb })}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2 text-sm mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <RiCheckLine size={15} className="text-text-secondary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg cursor-default"
                  >
                    {t("current")}
                  </button>
                ) : (
                  <Button className="w-full">{t("select_plan")}</Button>
                )}
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
