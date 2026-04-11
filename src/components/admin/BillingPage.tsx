"use client";

import { useTranslations } from "next-intl";
import {
  RiShoppingBag3Line,
  RiCalendarEventLine,
  RiUploadCloud2Line,
  RiShoppingCartLine,
  RiCheckboxCircleLine,
  RiRefundLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiHardDriveLine,
  RiImageLine,
  RiCalendarLine,
} from "@remixicon/react";
import { Button, Badge } from "@tremor/react";
import { useState } from "react";

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

const billingHistory = [
  { date: "2026-04-01", plan: "7 500 фото", amount: 300000, status: "paid" as const },
  { date: "2026-03-01", plan: "5 000 фото", amount: 250000, status: "paid" as const },
  { date: "2026-02-01", plan: "5 000 фото", amount: 250000, status: "refunded" as const },
  { date: "2026-01-01", plan: "2 500 фото", amount: 200000, status: "paid" as const },
];

const faqItems = [
  {
    q: "Что будет, если лимит фото закончится?",
    a: "Вы не сможете загружать новые фотографии в событие до тех пор, пока не перейдёте на более высокий пакет. Уже загруженные фотографии останутся доступны для просмотра и покупки участниками.",
  },
  {
    q: "Можно ли сменить тариф в середине периода?",
    a: "Да, вы можете перейти на другой пакет в любое время. При повышении пакета разница будет рассчитана пропорционально оставшимся дням. При понижении — новый тариф вступит в силу со следующего периода.",
  },
  {
    q: "Как работает автопродление?",
    a: "Подписка автоматически продлевается каждый месяц. За 3 дня до окончания периода мы отправим уведомление на вашу почту. Вы можете отменить автопродление в любое время.",
  },
  {
    q: "Что происходит при отмене подписки?",
    a: "При отмене подписка продолжает действовать до конца оплаченного периода. После этого доступ к загрузке новых фото будет приостановлен, но существующие события и фотографии сохранятся на срок хранения проекта.",
  },
  {
    q: "Возвращаются ли деньги при отмене?",
    a: "Возврат средств возможен в течение первых 7 дней после оплаты, если вы не загружали фотографии в текущем периоде. Для запроса возврата свяжитесь с поддержкой.",
  },
];

// --- Helpers ---

function ProgressBar({ used, total, label, icon: Icon }: {
  used: number;
  total: number;
  label: string;
  icon: React.ElementType;
}) {
  const pct = Math.min((used / total) * 100, 100);
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  const textColor = pct >= 90 ? "text-red-600" : pct >= 70 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-text-secondary" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-sm font-semibold tabular-nums ${textColor}`}>
          {used.toLocaleString("ru-RU")} / {total.toLocaleString("ru-RU")}
        </span>
      </div>
      <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg-secondary/50 transition-colors cursor-pointer"
      >
        <span className="text-sm font-medium pr-4">{q}</span>
        {open ? (
          <RiArrowUpSLine size={18} className="text-text-secondary shrink-0" />
        ) : (
          <RiArrowDownSLine size={18} className="text-text-secondary shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 -mt-1">
          <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// --- Component ---

export function BillingPage() {
  const t = useTranslations("billing");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {t("valid_until", {
              date: new Date(currentPlan.currentPeriodEnd).toLocaleDateString("ru-RU"),
            })}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
        >
          {t("cancel_subscription")}
        </Button>
      </div>

      {/* Event Photo Packages */}
      <div>
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
                  {t("current")}
                </span>
              )}

              <p className="text-xs text-text-secondary mb-1">{t("up_to")}</p>
              <p className="text-2xl font-bold tabular-nums leading-tight">{pkg.photos}</p>
              <p className="text-xs text-text-secondary mb-4">{t("photos_unit")}</p>

              <p className="text-lg font-semibold tabular-nums">{pkg.price} ₸</p>
              <p className="text-[11px] text-text-secondary mt-0.5 mb-4">
                ~{pkg.perPhoto} ₸ / {t("per_photo")}
              </p>

              <Button
                className="w-full"
                variant={pkg.current ? "primary" : "secondary"}
                disabled={pkg.current}
              >
                {pkg.current ? t("current") : t("select_plan")}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Usage / Использование ресурсов */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("usage_title")}</h2>
        <div className="rounded-xl border border-border p-5 space-y-5">
          <ProgressBar
            icon={RiCalendarLine}
            label={t("usage_events")}
            used={currentPlan.usedEvents}
            total={currentPlan.maxEvents}
          />
          <ProgressBar
            icon={RiImageLine}
            label={t("usage_photos")}
            used={currentPlan.usedPhotos}
            total={currentPlan.maxPhotosPerEvent}
          />
          <ProgressBar
            icon={RiHardDriveLine}
            label={t("usage_storage")}
            used={currentPlan.usedStorageGb}
            total={currentPlan.maxStorageGb}
          />
        </div>
      </div>

      {/* How it works / Как это работает */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("how_title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: 1,
              icon: RiShoppingBag3Line,
              title: t("how_step1_title"),
              desc: t("how_step1_desc"),
            },
            {
              step: 2,
              icon: RiCalendarEventLine,
              title: t("how_step2_title"),
              desc: t("how_step2_desc"),
            },
            {
              step: 3,
              icon: RiUploadCloud2Line,
              title: t("how_step3_title"),
              desc: t("how_step3_desc"),
            },
            {
              step: 4,
              icon: RiShoppingCartLine,
              title: t("how_step4_title"),
              desc: t("how_step4_desc"),
            },
          ].map((item) => {
            const StepIcon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col items-center text-center rounded-xl border border-border p-5"
              >
                <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center mb-3">
                  <StepIcon size={20} className="text-text-secondary" />
                </div>
                <p className="text-sm font-semibold mb-1">{item.step}. {item.title}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History / История платежей */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("history_title")}</h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                <th className="text-left px-5 py-3 font-medium text-text-secondary">{t("history_date")}</th>
                <th className="text-left px-5 py-3 font-medium text-text-secondary">{t("history_plan")}</th>
                <th className="text-right px-5 py-3 font-medium text-text-secondary">{t("history_amount")}</th>
                <th className="text-right px-5 py-3 font-medium text-text-secondary">{t("history_status")}</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 tabular-nums text-text-secondary">
                    {new Date(row.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 font-medium">{row.plan}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {row.amount.toLocaleString("ru-RU")} ₸
                  </td>
                  <td className="px-5 py-3 text-right">
                    {row.status === "paid" ? (
                      <Badge color="green" icon={RiCheckboxCircleLine} size="xs">
                        {t("history_paid")}
                      </Badge>
                    ) : (
                      <Badge color="gray" icon={RiRefundLine} size="xs">
                        {t("history_refunded")}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("faq_title")}</h2>
        <div className="space-y-2">
          {faqItems.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
