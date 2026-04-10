"use client";

import { useTranslations } from "next-intl";
import {} from "@remixicon/react";
import { Button } from "@tremor/react";

// --- Demo data ---

const currentPlan = {
  name: "Pro",
  priceMonthly: 9900,
  maxEvents: 20,
  maxPhotosPerEvent: 7500,
  maxStorageGb: 100,
  currentPeriodEnd: "2026-05-01",
  usedEvents: 5,
  usedPhotos: 12480,
  usedStorageGb: 34,
  currentPackagePhotos: "7 500",
  currentPackagePrice: "300 000",
  currentPackagePerPhoto: "40",
};

const eventPackages = [
  { photos: "2 500", price: "200 000", perPhoto: "80" },
  { photos: "5 000", price: "250 000", perPhoto: "50" },
  { photos: "7 500", price: "300 000", perPhoto: "40", current: true },
  { photos: "15 000", price: "400 000", perPhoto: "27" },
  { photos: "15 001+", price: "500 000", perPhoto: "~33" },
];

// --- Component ---

export function BillingPage() {
  const t = useTranslations("billing");

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
                pkg.current
                  ? "border-primary bg-primary/[0.03] ring-2 ring-primary/30"
                  : "border-border"
              }`}
            >
              {pkg.current && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white whitespace-nowrap">
                  Текущий тариф
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
                variant={pkg.current ? "primary" : "secondary"}
                disabled={pkg.current}
              >
                {pkg.current ? "Текущий" : "Купить"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
