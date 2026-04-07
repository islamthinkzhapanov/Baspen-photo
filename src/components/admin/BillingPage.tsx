"use client";

import { useTranslations } from "next-intl";
import {
  RiCheckLine,
  RiVipCrownLine,
  RiFlashlightLine,
  RiBuilding2Line,
  RiImageLine,
  RiCalendarLine,
  RiHardDriveLine,
} from "@remixicon/react";
import { Card, Button } from "@tremor/react";

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
    icon: RiFlashlightLine,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
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
    icon: RiVipCrownLine,
    color: "text-primary",
    bgColor: "bg-primary/10",
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
    icon: RiBuilding2Line,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
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

const eventPricing = [
  { photos: "2 500", price: "200 000" },
  { photos: "5 000", price: "250 000" },
  { photos: "7 500", price: "300 000" },
  { photos: "15 000", price: "400 000" },
  { photos: "15 001+", price: "500 000" },
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
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      barColor: "bg-amber-500",
    },
    {
      icon: RiCalendarLine,
      label: t("limit_events", { count: currentPlan.maxEvents }),
      used: currentPlan.usedEvents,
      max: currentPlan.maxEvents,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      barColor: "bg-primary",
    },
    {
      icon: RiHardDriveLine,
      label: t("limit_storage", { gb: currentPlan.maxStorageGb }),
      used: currentPlan.usedStorageGb,
      max: currentPlan.maxStorageGb,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      barColor: "bg-emerald-500",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("valid_until", {
            date: new Date(currentPlan.currentPeriodEnd).toLocaleDateString("ru-RU"),
          })}
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="p-0 overflow-hidden border-0 shadow-sm">
        <div className="bg-gradient-to-r from-primary to-blue-500 p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RiVipCrownLine size={16} className="opacity-80" />
                <span className="text-sm opacity-80">{t("current_plan")}</span>
              </div>
              <p className="text-3xl font-bold">{currentPlan.name}</p>
              <p className="text-sm opacity-80 mt-1">
                {currentPlan.priceMonthly.toLocaleString("ru-RU")} {t("kzt_month")}
              </p>
            </div>
            <button className="text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 transition-colors w-fit">
              {t("cancel_subscription")}
            </button>
          </div>
        </div>

        {/* Usage bars inline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {usageItems.map((item) => {
            const Icon = item.icon;
            const percent = Math.round((item.used / item.max) * 100);
            return (
              <div key={item.label} className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                    <Icon size={16} className={item.iconColor} />
                  </div>
                  <span className="text-xs text-text-secondary">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-bold">{item.used.toLocaleString("ru-RU")}</span>
                  <span className="text-xs text-text-secondary">/ {item.max.toLocaleString("ru-RU")}</span>
                </div>
                <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.barColor}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("available_plans")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentPlan.name;
            const PlanIcon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`p-0 overflow-hidden relative transition-all ${
                  isCurrent ? "ring-2 ring-primary" : "hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="bg-primary text-white text-xs font-medium text-center py-1.5">
                    {t("popular") ?? "Популярный"}
                  </div>
                )}

                <div className="p-5 space-y-5">
                  {/* Plan header */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.bgColor}`}>
                      <PlanIcon size={20} className={plan.color} />
                    </div>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div>
                    {plan.priceMonthly === 0 ? (
                      <span className="text-2xl font-bold text-success">{t("free")}</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          {plan.priceMonthly.toLocaleString("ru-RU")}
                        </span>
                        <span className="text-sm text-text-secondary">{t("kzt_month")}</span>
                      </div>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="space-y-1.5 text-sm text-text-secondary py-3 border-y border-border">
                    <p>{plan.maxEvents === -1 ? "Безлимит мероприятий" : t("limit_events", { count: plan.maxEvents })}</p>
                    <p>{t("limit_photos", { count: plan.maxPhotosPerEvent.toLocaleString("ru-RU") })}</p>
                    <p>{t("limit_storage", { gb: plan.maxStorageGb })}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <RiCheckLine size={16} className="text-success flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      {t("current")}
                    </Button>
                  ) : (
                    <Button className="w-full">{t("select_plan")}</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Event Pricing Table */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Эксклюзивный пакет</h2>
        <p className="text-sm text-text-secondary mb-4">
          Оплата за мероприятие в зависимости от количества фото
        </p>

        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-secondary">
                <th className="text-left px-5 py-3 font-medium text-text-secondary">Кол-во фото</th>
                <th className="text-right px-5 py-3 font-medium text-text-secondary">Стоимость</th>
              </tr>
            </thead>
            <tbody>
              {eventPricing.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-border hover:bg-bg-secondary/50 transition-colors"
                >
                  <td className="px-5 py-3">До {row.photos} фото</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {row.price} ₸
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
