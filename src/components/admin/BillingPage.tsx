"use client";

import { useTranslations } from "next-intl";
import {
  RiCheckLine,
  RiVipCrownLine,
  RiFlashlightLine,
  RiBuilding2Line,
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

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold font-display">{t("title")}</h1>

      {/* Current Plan */}
      <Card className="border-primary/30 p-5 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <RiVipCrownLine size={20} className="text-primary" />
          <h2 className="font-medium">{t("current_plan")}</h2>
        </div>
        <p className="text-lg font-bold">{currentPlan.name}</p>
        <p className="text-sm text-text-secondary mt-1">
          {currentPlan.priceMonthly.toLocaleString()} {t("kzt_month")}
        </p>
        <div className="mt-3 text-sm text-text-secondary space-y-1">
          <p>{t("limit_events", { count: currentPlan.maxEvents })}</p>
          <p>{t("limit_photos", { count: currentPlan.maxPhotosPerEvent.toLocaleString() })}</p>
          <p>{t("limit_storage", { gb: currentPlan.maxStorageGb })}</p>
        </div>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="text-text-secondary">
            {t("valid_until", {
              date: new Date(currentPlan.currentPeriodEnd).toLocaleDateString("ru-RU"),
            })}
          </span>
          <button className="text-red-500 hover:text-red-600 text-sm">
            {t("cancel_subscription")}
          </button>
        </div>
      </Card>

      {/* Available Plans */}
      <h2 className="text-lg font-medium">{t("available_plans")}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlan.name;
          const PlanIcon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`p-5 space-y-4 relative ${
                isCurrent
                  ? "border-primary bg-primary/5"
                  : "hover:border-border-active"
              } transition-colors`}
            >
              {plan.popular && (
                <Badge color="blue" size="xs" className="absolute -top-2.5 left-4">
                  Популярный
                </Badge>
              )}

              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isCurrent ? "bg-primary/10 text-primary" : "bg-bg-secondary text-text-secondary"
                  }`}
                >
                  <PlanIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xl font-bold text-primary">
                    {plan.priceMonthly === 0
                      ? t("free")
                      : `${plan.priceMonthly.toLocaleString()} ${t("kzt_month")}`}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <RiCheckLine size={16} className="text-success flex-shrink-0" />
                  {plan.maxEvents === -1
                    ? "Безлимит мероприятий"
                    : t("limit_events", { count: plan.maxEvents })}
                </li>
                <li className="flex items-center gap-2">
                  <RiCheckLine size={16} className="text-success flex-shrink-0" />
                  {t("limit_photos", { count: plan.maxPhotosPerEvent.toLocaleString() })}
                </li>
                <li className="flex items-center gap-2">
                  <RiCheckLine size={16} className="text-success flex-shrink-0" />
                  {t("limit_storage", { gb: plan.maxStorageGb })}
                </li>
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
    </div>
  );
}
