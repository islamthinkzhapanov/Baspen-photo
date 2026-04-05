"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import {
  RiImageLine,
  RiGroupLine,
  RiDownloadLine,
  RiMoneyDollarCircleLine,
  RiShoppingCartLine,
  RiSearchLine,
} from "@remixicon/react";
import { useEventAnalytics } from "@/hooks/useAnalytics";
import { Card, LineChart, DonutChart } from "@tremor/react";

type Period = "today" | "week" | "month" | "all";

function getDateRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();

  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { from: start.toISOString(), to };
    }
    case "month": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return { from: start.toISOString(), to };
    }
    case "all":
    default:
      return { from: new Date(0).toISOString(), to };
  }
}

export function AnalyticsSection({ eventId }: { eventId: string }) {
  const t = useTranslations("analytics");
  const [period, setPeriod] = useState<Period>("month");

  const { from, to } = useMemo(() => getDateRange(period), [period]);
  const { data, isLoading } = useEventAnalytics(eventId, from, to);

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: t("period_today") },
    { key: "week", label: t("period_week") },
    { key: "month", label: t("period_month") },
    { key: "all", label: t("period_all") },
  ];

  const searchData = useMemo(() => {
    if (!data) return [];
    return [
      { name: t("by_face"), value: data.searchBreakdown.face },
      { name: t("by_number"), value: data.searchBreakdown.number },
    ].filter((d) => d.value > 0);
  }, [data, t]);

  const revenueChartData = useMemo(() => {
    if (!data) return [];
    return data.revenueByDay.map((d: { date: string; revenue: number }) => ({
      date: new Date(d.date).toLocaleDateString("ru", {
        day: "numeric",
        month: "short",
      }),
      [t("total_revenue")]: d.revenue,
    }));
  }, [data, t]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="h-6 w-32 bg-bg-secondary rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-bg-secondary rounded-xl animate-pulse" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{t("title")}</h2>
        <div className="flex gap-1">
          {periods.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                period === key
                  ? "bg-primary text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="text-center py-12 text-text-secondary text-sm">
          {t("no_data")}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard
              icon={RiImageLine}
              label={t("total_photos")}
              value={data.totalPhotos}
            />
            <StatCard
              icon={RiGroupLine}
              label={t("total_participants")}
              value={data.totalParticipants}
            />
            <StatCard
              icon={RiDownloadLine}
              label={t("total_downloads")}
              value={data.totalMatches}
            />
            <StatCard
              icon={RiShoppingCartLine}
              label={t("orders")}
              value={data.totalOrders}
            />
            <StatCard
              icon={RiMoneyDollarCircleLine}
              label={t("total_revenue")}
              value={`${data.totalRevenue.toLocaleString()} ${t("currency_kzt")}`}
              highlight
            />
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Revenue line chart */}
            <div className="md:col-span-2 bg-bg-secondary rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3">{t("revenue_trend")}</h3>
              {revenueChartData.length > 0 ? (
                <LineChart
                  data={revenueChartData}
                  index="date"
                  categories={[t("total_revenue")]}
                  colors={["blue"]}
                  className="h-60"
                  yAxisWidth={56}
                />
              ) : (
                <div className="h-60 flex items-center justify-center text-text-secondary text-sm">
                  {t("no_data")}
                </div>
              )}
            </div>

            {/* Search breakdown donut */}
            <div className="bg-bg-secondary rounded-xl p-4">
              <h3 className="text-sm font-medium mb-3">{t("search_stats")}</h3>
              {searchData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <DonutChart
                    data={searchData}
                    category="value"
                    index="name"
                    colors={["blue", "green"]}
                    className="h-40"
                  />
                  <div className="flex gap-4 mt-2">
                    {searchData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        {d.name}: {d.value}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-text-secondary text-sm">
                  {t("no_data")}
                </div>
              )}

              {/* Conversion */}
              {data.totalParticipants > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <RiSearchLine size={16} className="text-text-secondary" />
                    <span className="text-text-secondary">{t("conversion")}:</span>
                    <span className="font-medium">
                      {Math.round(
                        (data.totalOrders / data.totalParticipants) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Popular photos */}
          {data.popularPhotos.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-3">{t("popular_photos")}</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {data.popularPhotos.map(
                  (p: {
                    photoId: string;
                    thumbnailPath: string | null;
                    purchaseCount: number;
                  }) => (
                    <div
                      key={p.photoId}
                      className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-bg-secondary"
                    >
                      {p.thumbnailPath && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.thumbnailPath}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-tl">
                        {p.purchaseCount}x
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof RiImageLine;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        highlight ? "bg-primary/10 border border-primary/20" : "bg-bg-secondary"
      }`}
    >
      <Icon
        size={16}
        className={`mb-1 ${
          highlight ? "text-primary" : "text-text-secondary"
        }`}
      />
      <div className={`text-lg font-bold ${highlight ? "text-primary" : ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  );
}
