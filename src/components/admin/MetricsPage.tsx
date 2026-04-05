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
} from "@remixicon/react";
import { RiShoppingCartLine } from "@remixicon/react";
import { Card, BarChart } from "@tremor/react";

function MetricCard({
  icon: Icon,
  label,
  value,
  growth,
  growthLabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  growth?: number;
  growthLabel?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
        <p className="text-sm text-text-secondary">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {growth !== undefined && (
        <p className="text-xs text-text-secondary mt-1">
          <span className={growth > 0 ? "text-success" : "text-text-secondary"}>
            +{growth}
          </span>{" "}
          {growthLabel}
        </p>
      )}
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function MetricsPage() {
  const t = useTranslations("admin");
  const { data, isLoading } = useAdminMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-display">{t("metrics_title")}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totals = data?.totals || {};
  const growth = data?.monthGrowth || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">{t("metrics_title")}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={RiGroupLine}
          label={t("total_users")}
          value={totals.users?.toLocaleString() || "0"}
          growth={growth.newUsers}
          growthLabel={t("this_month")}
        />
        <MetricCard
          icon={RiFolderOpenLine}
          label={t("total_events")}
          value={totals.events?.toLocaleString() || "0"}
          growth={growth.newEvents}
          growthLabel={t("this_month")}
        />
        <MetricCard
          icon={RiCameraLine}
          label={t("total_photos")}
          value={totals.photos?.toLocaleString() || "0"}
          growth={growth.newPhotos}
          growthLabel={t("this_month")}
        />
        <MetricCard
          icon={RiSearchLine}
          label={t("total_participants")}
          value={totals.participants?.toLocaleString() || "0"}
        />
        <MetricCard
          icon={RiShoppingCartLine}
          label={t("total_orders")}
          value={totals.orders?.toLocaleString() || "0"}
        />
        <MetricCard
          icon={RiStackLine}
          label={t("active_subscriptions")}
          value={totals.activeSubscriptions?.toLocaleString() || "0"}
        />
        <MetricCard
          icon={RiHardDriveLine}
          label={t("storage_used")}
          value={formatBytes(data?.storage?.totalBytes || 0)}
        />
        <MetricCard
          icon={RiArrowUpLine}
          label={t("avg_photos_per_event")}
          value={
            totals.events > 0
              ? Math.round(totals.photos / totals.events)
              : 0
          }
        />
      </div>

      {/* User registration chart */}
      {data?.charts?.usersPerDay?.length > 0 && (
        <Card className="p-4">
          <h2 className="font-medium mb-4">{t("users_per_day")}</h2>
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
        </Card>
      )}
    </div>
  );
}
