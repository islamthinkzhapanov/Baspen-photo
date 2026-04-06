"use client";

import { useTranslations } from "next-intl";
import {
  RiCheckLine,
  RiVipCrownLine,
  RiFlashlightLine,
  RiBuilding2Line,
  RiCalendarLine,
  RiImageLine,
  RiHardDriveLine,
  RiStarLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import { Card, Button, Badge } from "@tremor/react";

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
    color: "bg-emerald-50 text-emerald-600",
    features: ["Базовое распознавание лиц", "Водяные знаки", "Email-поддержка"],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 9900,
    maxEvents: 20,
    maxPhotosPerEvent: 50000,
    maxStorageGb: 100,
    icon: RiVipCrownLine,
    color: "bg-primary/10 text-primary",
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
    color: "bg-violet-50 text-violet-600",
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

// --- Component ---

export function BillingPage() {
  const t = useTranslations("billing");

  const usageItems = [
    {
      icon: RiCalendarLine,
      label: t("limit_events", { count: currentPlan.maxEvents }),
      used: currentPlan.usedEvents,
      max: currentPlan.maxEvents,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: RiImageLine,
      label: t("limit_photos", { count: currentPlan.maxPhotosPerEvent.toLocaleString("ru-RU") }),
      used: currentPlan.usedPhotos,
      max: currentPlan.maxPhotosPerEvent,
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: RiHardDriveLine,
      label: t("limit_storage", { gb: currentPlan.maxStorageGb }),
      used: currentPlan.usedStorageGb,
      max: currentPlan.maxStorageGb,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("valid_until", {
            date: new Date(currentPlan.currentPeriodEnd).toLocaleDateString("ru-RU"),
          })}
        </p>
      </div>

      {/* Current Plan + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Current plan card */}
        <Card className="bg-primary text-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <RiVipCrownLine size={18} className="opacity-80" />
            <span className="text-sm opacity-80">{t("current_plan")}</span>
          </div>
          <p className="text-2xl font-bold">{currentPlan.name}</p>
          <p className="text-sm opacity-80 mt-1">
            {currentPlan.priceMonthly.toLocaleString("ru-RU")} {t("kzt_month")}
          </p>
          <button className="mt-4 text-xs bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition-colors">
            {t("cancel_subscription")}
          </button>
        </Card>

        {/* Usage cards */}
        {usageItems.map((item) => {
          const Icon = item.icon;
          const percent = Math.round((item.used / item.max) * 100);
          return (
            <Card key={item.label} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                  <Icon size={20} />
                </div>
                <Badge color={percent > 80 ? "red" : percent > 50 ? "amber" : "green"} size="xs">
                  {percent}%
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {item.used.toLocaleString("ru-RU")}
                  <span className="text-sm font-normal text-text-secondary"> / {item.max.toLocaleString("ru-RU")}</span>
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{item.label}</p>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percent > 80 ? "bg-red-500" : percent > 50 ? "bg-amber-500" : "bg-success"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <RiStarLine size={16} className="text-text-secondary" />
          {t("available_plans")}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlan.name;
          const PlanIcon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`p-5 space-y-4 relative transition-colors ${
                isCurrent
                  ? "border-primary bg-primary/5"
                  : "hover:border-border-active"
              }`}
            >
              {plan.popular && (
                <Badge color="blue" size="xs" className="absolute -top-2.5 left-4">
                  Популярный
                </Badge>
              )}

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.color}`}>
                  <PlanIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                </div>
              </div>

              <p className="text-2xl font-bold">
                {plan.priceMonthly === 0 ? (
                  <span className="text-success">{t("free")}</span>
                ) : (
                  <>
                    {plan.priceMonthly.toLocaleString("ru-RU")}
                    <span className="text-sm font-normal text-text-secondary"> {t("kzt_month")}</span>
                  </>
                )}
              </p>

              {/* Limits */}
              <div className="space-y-2 text-sm text-text-secondary border-t border-border pt-3">
                <p>{plan.maxEvents === -1 ? "Безлимит мероприятий" : t("limit_events", { count: plan.maxEvents })}</p>
                <p>{t("limit_photos", { count: plan.maxPhotosPerEvent.toLocaleString("ru-RU") })}</p>
                <p>{t("limit_storage", { gb: plan.maxStorageGb })}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <RiCheckLine size={16} className="text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="secondary" className="w-full opacity-60 cursor-default" disabled>
                  {t("current")}
                </Button>
              ) : (
                <Button className="w-full">{t("select_plan")}</Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quick Info Bar */}
      <Card className="p-0 overflow-hidden">
        <button className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-bg-secondary transition-colors border-b border-border last:border-0 cursor-pointer">
          <div className="w-9 h-9 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
            <RiVipCrownLine size={16} className="text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Сравнение тарифов</p>
            <p className="text-xs text-text-secondary">Подробная таблица всех возможностей</p>
          </div>
          <RiArrowRightSLine size={16} className="text-text-secondary" />
        </button>
        <button className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-bg-secondary transition-colors border-b border-border last:border-0 cursor-pointer">
          <div className="w-9 h-9 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
            <RiCalendarLine size={16} className="text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">История платежей</p>
            <p className="text-xs text-text-secondary">Все счета и чеки</p>
          </div>
          <RiArrowRightSLine size={16} className="text-text-secondary" />
        </button>
      </Card>
    </div>
  );
}
