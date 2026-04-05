"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminFinance } from "@/hooks/useAdmin";
import {
  RiBankCardLine,
  RiGroupLine,
  RiArrowUpLine,
  RiMoneyDollarCircleLine,
} from "@remixicon/react";
import {
  Card,
  TabGroup,
  TabList,
  Tab,
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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-xs text-text-secondary">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export function AdminFinancePage() {
  const t = useTranslations("admin");
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");

  const from = computeFromDate(period);

  const { data, isLoading } = useAdminFinance(from);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("ru-KZ", {
      style: "currency",
      currency: "KZT",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const periodIndex = period === "week" ? 0 : period === "month" ? 1 : 2;
  const periods = ["week", "month", "all"] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{t("finance_title")}</h1>
        <TabGroup
          index={periodIndex}
          onIndexChange={(i) => setPeriod(periods[i])}
          className="w-auto"
        >
          <TabList variant="solid">
            {periods.map((p) => (
              <Tab key={p}>{t(`period_${p}`)}</Tab>
            ))}
          </TabList>
        </TabGroup>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={RiMoneyDollarCircleLine}
              label={t("photo_sales")}
              value={formatCurrency(data?.photoSalesRevenue || 0)}
              sub={t("orders_count", { count: data?.photoSalesOrders || 0 })}
            />
            <StatCard
              icon={RiBankCardLine}
              label={t("subscription_revenue")}
              value={formatCurrency(data?.subscriptionMonthlyRevenue || 0)}
              sub={t("per_month")}
            />
            <StatCard
              icon={RiGroupLine}
              label={t("active_subscribers")}
              value={String(data?.activeSubscriptions || 0)}
            />
            <StatCard
              icon={RiArrowUpLine}
              label={t("total_platform_revenue")}
              value={formatCurrency(
                (data?.photoSalesRevenue || 0) +
                  (data?.subscriptionMonthlyRevenue || 0)
              )}
            />
          </div>

          {data?.topEvents?.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="font-medium">{t("top_events")}</h2>
              </div>
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
            </Card>
          )}
        </>
      )}
    </div>
  );
}
