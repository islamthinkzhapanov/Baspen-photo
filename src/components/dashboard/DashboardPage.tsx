"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RiCameraLine,
  RiSearchLine,
  RiArrowUpLine,
  RiAddLine,
  RiArrowRightUpLine,
  RiImageLine,
  RiEyeLine,
} from "@remixicon/react";
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
} from "@tremor/react";
import { LineChart, BarChart, DonutChart } from "@/components/charts";
// --- Demo data ---

const stats = [
  {
    key: "active_projects",
    value: 5,
    change: "+2",
    icon: RiCameraLine,
    color: "bg-primary/10 text-primary",
  },
  {
    key: "total_photos",
    value: "12 480",
    change: "+1 230",
    icon: RiImageLine,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "searches",
    value: "3 291",
    change: "+412",
    icon: RiSearchLine,
    color: "bg-amber-50 text-amber-600",
  },
  {
    key: "revenue",
    value: "428 500 ₸",
    change: "+18%",
    icon: RiArrowUpLine,
    color: "bg-violet-50 text-violet-600",
  },
];

const revenueByDay = [
  { date: "28 мар", revenue: 12000 },
  { date: "29 мар", revenue: 18500 },
  { date: "30 мар", revenue: 9200 },
  { date: "31 мар", revenue: 31000 },
  { date: "1 апр", revenue: 22400 },
  { date: "2 апр", revenue: 45000 },
  { date: "3 апр", revenue: 38700 },
  { date: "4 апр", revenue: 27300 },
  { date: "5 апр", revenue: 41200 },
];

const searchesByDay = [
  { date: "28 мар", face: 120, number: 45 },
  { date: "29 мар", face: 185, number: 62 },
  { date: "30 мар", face: 95, number: 38 },
  { date: "31 мар", face: 310, number: 110 },
  { date: "1 апр", face: 245, number: 88 },
  { date: "2 апр", face: 420, number: 155 },
  { date: "3 апр", face: 380, number: 132 },
  { date: "4 апр", face: 290, number: 98 },
  { date: "5 апр", face: 350, number: 125 },
];

const topEvents = [
  {
    name: "Almaty Marathon 2026",
    photos: 4200,
    searches: 1580,
    revenue: 185000,
    status: "active",
    date: "30 мар 2026",
  },
  {
    name: "Nauryz Festival",
    photos: 3100,
    searches: 890,
    revenue: 124500,
    status: "active",
    date: "22 мар 2026",
  },
  {
    name: "Tech Conference KZ",
    photos: 2800,
    searches: 520,
    revenue: 78000,
    status: "completed",
    date: "15 мар 2026",
  },
  {
    name: "Корпоратив Kaspi",
    photos: 1580,
    searches: 210,
    revenue: 41000,
    status: "completed",
    date: "8 мар 2026",
  },
];

const searchTypePie = [
  { name: "По лицу", value: 72 },
  { name: "По номеру", value: 28 },
];

// --- Dashboard ---

export function DashboardPage() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("dashboard.title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <Link href="/events/new">
          <Button icon={() => <RiAddLine size={16} />}>
            {t("dashboard.new_project")}
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <Badge color="green" size="xs">
                  {stat.change}
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{t(`dashboard.${stat.key}`)}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {topEvents.length > 0 ? (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">{t("dashboard.revenue_trend")}</h2>
                <span className="text-xs text-text-secondary">{t("dashboard.last_9_days")}</span>
              </div>
              <LineChart
                data={revenueByDay}
                index="date"
                categories={["revenue"]}
                colors={["blue"]}
                valueFormatter={(value) => {
                  const num = Number(value);
                  if (num >= 1000) return `${Math.round(num / 1000)}к ₸`;
                  return `${num} ₸`;
                }}
                className="h-64"
                showLegend={false}
              />
            </Card>

            <Card className="p-5 flex flex-col">
              <h2 className="text-sm font-semibold">{t("dashboard.search_type")}</h2>
              <DonutChart
                data={searchTypePie}
                index="name"
                category="value"
                colors={["blue", "sky"]}
                valueFormatter={(value) => `${value}%`}
                className="flex-1 flex items-center justify-center"
              />
            </Card>
          </div>

          {/* Searches chart */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold mb-4">{t("dashboard.searches_dynamics")}</h2>
            <BarChart
              data={searchesByDay}
              index="date"
              categories={["face", "number"]}
              colors={["blue", "sky"]}
              stack
              className="h-56"
            />
          </Card>

          {/* Bottom Row: Projects + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">{t("dashboard.top_projects")}</h2>
                <Link
                  href="/events"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {t("dashboard.view_all")}
                  <RiArrowRightUpLine size={12} />
                </Link>
              </div>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{t("dashboard.project")}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t("dashboard.photos_col")}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t("dashboard.searches_col")}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t("dashboard.revenue_col")}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t("dashboard.status_col")}</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topEvents.map((event) => (
                    <TableRow key={event.name}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.name}</p>
                          <p className="text-xs text-text-secondary">{event.date}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{event.photos.toLocaleString("ru-RU")}</TableCell>
                      <TableCell className="text-right tabular-nums">{event.searches.toLocaleString("ru-RU")}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {event.revenue.toLocaleString("ru-RU")} ₸
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge color={event.status === "active" ? "green" : "gray"} size="xs">
                          {event.status === "active"
                            ? t("dashboard.status_active")
                            : t("dashboard.status_completed")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="lg:col-span-2 p-5 flex flex-col">
              <h2 className="text-sm font-semibold">{t("dashboard.conversion_title")}</h2>
              <p className="text-xs text-text-secondary mt-0.5">{t("dashboard.conversion_desc")}</p>

              <div className="mt-5 space-y-4 flex-1 flex flex-col justify-center">
                {/* Visitors */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm text-text-secondary">{t("dashboard.visitors")}</span>
                    <span className="text-sm font-semibold tabular-nums">8 420</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-primary" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* Searchers */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm text-text-secondary">{t("dashboard.searchers")}</span>
                    <span className="text-sm font-semibold tabular-nums">3 291</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: "39%" }} />
                  </div>
                </div>

                {/* Buyers */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm text-text-secondary">{t("dashboard.buyers")}</span>
                    <span className="text-sm font-semibold tabular-nums">486</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: "5.8%" }} />
                  </div>
                </div>
              </div>

              {/* Conversion rate */}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm text-text-secondary">{t("dashboard.conversion_rate")}</span>
                <span className="text-xl font-bold text-primary">5.8%</span>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <RiCameraLine size={32} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">{t("dashboard.no_projects")}</h2>
            <p className="text-sm text-text-secondary mt-2">{t("dashboard.no_projects_desc")}</p>
            <Link href="/events/new" className="inline-block mt-5">
              <Button icon={() => <RiAddLine size={16} />}>
                {t("dashboard.new_project")}
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

