"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminFinance } from "@/hooks/useAdmin";
import {
  RiBankCardLine,
  RiGroupLine,
  RiArrowUpLine,
  RiMoneyDollarCircleLine,
  RiLineChartLine,
} from "@remixicon/react";
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";

function computeFromDate(period: string): string | undefined {
  if (period === "week") return new Date(Date.now() - 7 * 86400000).toISOString();
  if (period === "month") return new Date(Date.now() - 30 * 86400000).toISOString();
  return undefined;
}

const DEMO_FINANCE = {
  photoSalesRevenue: 1284000,
  photoSalesOrders: 342,
  subscriptionMonthlyRevenue: 198000,
  activeSubscriptions: 18,
  topEvents: [
    { eventId: "e1", eventTitle: "Almaty Marathon 2026", revenue: "485000", orderCount: 128 },
    { eventId: "e5", eventTitle: "Ironman Astana 70.3", revenue: "312000", orderCount: 89 },
    { eventId: "e8", eventTitle: "Run The Silk Road", revenue: "198500", orderCount: 56 },
    { eventId: "e2", eventTitle: "Nauryz Festival", revenue: "164000", orderCount: 43 },
    { eventId: "e3", eventTitle: "Tech Conference KZ", revenue: "78000", orderCount: 18 },
    { eventId: "e4", eventTitle: "Корпоратив Kaspi", revenue: "46500", orderCount: 8 },
  ],
};

export function AdminFinancePage() {
  const t = useTranslations("admin");
  const periods = ["week", "month", "all"] as const;
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");

  const from = computeFromDate(period);

  const { data: apiData } = useAdminFinance(from);
  const data = apiData ?? DEMO_FINANCE;

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("ru-KZ", {
      style: "currency",
      currency: "KZT",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const statCards = [
    {
      icon: RiMoneyDollarCircleLine,
      label: t("photo_sales"),
      value: formatCurrency(data?.photoSalesRevenue || 0),
      sub: t("orders_count", { count: data?.photoSalesOrders || 0 }),
      color: "bg-primary/10 text-primary",
    },
    {
      icon: RiBankCardLine,
      label: t("subscription_revenue"),
      value: formatCurrency(data?.subscriptionMonthlyRevenue || 0),
      sub: t("per_month"),
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: RiGroupLine,
      label: t("active_subscribers"),
      value: String(data?.activeSubscriptions || 0),
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: RiArrowUpLine,
      label: t("total_platform_revenue"),
      value: formatCurrency(
        (data?.photoSalesRevenue || 0) + (data?.subscriptionMonthlyRevenue || 0)
      ),
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{t("finance_title")}</h1>
        <div className="flex bg-bg-secondary rounded-lg p-1 gap-0.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === p
                  ? "bg-bg text-text font-medium"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {t(`period_${p}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
                {stat.sub && <p className="text-xs text-text-secondary">{stat.sub}</p>}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-medium">{t("top_events")}</h2>
        </div>
        {data?.topEvents?.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("event")}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t("orders_col")}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t("revenue")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.topEvents.map(
                (e: {
                  eventId: string;
                  eventTitle: string;
                  revenue: string;
                  orderCount: number;
                }) => (
                  <TableRow key={e.eventId}>
                    <TableCell>{e.eventTitle}</TableCell>
                    <TableCell className="text-right">{e.orderCount}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(e.revenue))}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mb-3">
              <RiLineChartLine size={24} className="text-text-secondary" />
            </div>
            <p className="text-sm text-text-secondary">{t("no_top_events")}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
