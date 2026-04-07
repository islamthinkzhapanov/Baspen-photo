"use client";

import { useTranslations } from "next-intl";
import { useAdminMetrics } from "@/hooks/useAdmin";
import {
  RiGroupLine,
  RiFolderOpenLine,
  RiCameraLine,
  RiSearchLine,
  RiStackLine,
  RiArrowUpLine,
  RiHardDriveLine,
  RiShoppingCartLine,
  RiBarChartBoxLine,
} from "@remixicon/react";
import { Card } from "@tremor/react";
import { BarChart } from "@/components/charts";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function MetricsPage() {
  const t = useTranslations("admin");
  const { data } = useAdminMetrics();

  const totals = data?.totals || {};
  const growth = data?.monthGrowth || {};

  const metricCards = [
    {
      icon: RiGroupLine,
      label: t("total_users"),
      value: totals.users?.toLocaleString("ru-RU") || "0",
      growth: growth.newUsers,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: RiFolderOpenLine,
      label: t("total_events"),
      value: totals.events?.toLocaleString("ru-RU") || "0",
      growth: growth.newEvents,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: RiCameraLine,
      label: t("total_photos"),
      value: totals.photos?.toLocaleString("ru-RU") || "0",
      growth: growth.newPhotos,
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: RiSearchLine,
      label: t("total_participants"),
      value: totals.participants?.toLocaleString("ru-RU") || "0",
      color: "bg-violet-50 text-violet-600",
    },
    {
      icon: RiShoppingCartLine,
      label: t("total_orders"),
      value: totals.orders?.toLocaleString("ru-RU") || "0",
      color: "bg-rose-50 text-rose-600",
    },
    {
      icon: RiStackLine,
      label: t("active_subscriptions"),
      value: totals.activeSubscriptions?.toLocaleString("ru-RU") || "0",
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      icon: RiHardDriveLine,
      label: t("storage_used"),
      value: formatBytes(data?.storage?.totalBytes || 0),
      color: "bg-orange-50 text-orange-600",
    },
    {
      icon: RiArrowUpLine,
      label: t("avg_photos_per_event"),
      value: String(totals.events > 0 ? Math.round(totals.photos / totals.events) : 0),
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">{t("metrics_title")}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
                {stat.growth !== undefined && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    <span className="text-success">+{stat.growth.toLocaleString("ru-RU")}</span>{" "}
                    {t("this_month")}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <h2 className="font-medium mb-4">{t("users_per_day")}</h2>
        {data?.charts?.usersPerDay?.length > 0 ? (
          <BarChart
            data={data.charts.usersPerDay.map((d: { date: string; count: number }) => ({
              date: d.date,
              count: d.count,
            }))}
            index="date"
            categories={["count"]}
            colors={["blue"]}
            className="h-32"
            showLegend={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mb-3">
              <RiBarChartBoxLine size={24} className="text-text-secondary" />
            </div>
            <p className="text-sm text-text-secondary">{t("no_metrics_data")}</p>
            <p className="text-xs text-text-secondary mt-1">{t("no_metrics_data_desc")}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
