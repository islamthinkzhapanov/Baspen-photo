"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RiCameraLine,
  RiGroupLine,
  RiSearchLine,
  RiArrowUpLine,
  RiAddLine,
  RiArrowRightUpLine,
  RiImageLine,
  RiEyeLine,
  RiDownloadLine,
  RiMoneyDollarCircleLine,
} from "@remixicon/react";
import {
  Card,
  LineChart,
  BarChart,
  DonutChart,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
} from "@tremor/react";

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

const recentActivity = [
  { type: "purchase", text: "Покупка 12 фото — Almaty Marathon", time: "5 мин назад" },
  { type: "upload", text: "Загружено 340 фото — Nauryz Festival", time: "1 час назад" },
  { type: "search", text: "1 580 поисков — Almaty Marathon", time: "2 часа назад" },
  { type: "purchase", text: "Покупка пакета «Все мои фото» — Tech Conference", time: "3 часа назад" },
  { type: "upload", text: "Загружено 120 фото — Almaty Marathon", time: "5 часов назад" },
];

const activityIcon = {
  purchase: RiMoneyDollarCircleLine,
  upload: RiDownloadLine,
  search: RiEyeLine,
};

const activityColor = {
  purchase: "bg-emerald-50 text-emerald-600",
  upload: "bg-primary/10 text-primary",
  search: "bg-amber-50 text-amber-600",
};

// --- Component ---

export function DashboardPage() {
  const t = useTranslations();

  return (
    <div className="space-y-6 max-w-[1200px]">
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
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
            valueFormatter={(value) => `${Number(value).toLocaleString()} ₸`}
            className="h-64"
            showLegend={false}
          />
        </Card>

        {/* Search Type Pie */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4">{t("dashboard.search_type")}</h2>
          <DonutChart
            data={searchTypePie}
            index="name"
            category="value"
            colors={["blue", "sky"]}
            valueFormatter={(value) => `${value}%`}
            className="h-44"
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
        {/* Top Projects */}
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
                  <TableCell className="text-right tabular-nums">{event.photos.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{event.searches.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {event.revenue.toLocaleString()} ₸
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

        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-sm font-semibold mb-4">{t("dashboard.recent_activity")}</h2>
          <div className="space-y-4">
            {recentActivity.map((item, i) => {
              const Icon = activityIcon[item.type as keyof typeof activityIcon];
              const color = activityColor[item.type as keyof typeof activityColor];
              return (
                <div key={i} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-tight">{item.text}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Quick Stats Bar */}
      <Card className="bg-primary/5 border-primary/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <RiGroupLine size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("dashboard.conversion_title")}</p>
            <p className="text-xs text-text-secondary">{t("dashboard.conversion_desc")}</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-text-secondary text-xs">{t("dashboard.visitors")}</p>
            <p className="font-bold text-lg">8 420</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">{t("dashboard.searchers")}</p>
            <p className="font-bold text-lg">3 291</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">{t("dashboard.buyers")}</p>
            <p className="font-bold text-lg">486</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">{t("dashboard.conversion_rate")}</p>
            <p className="font-bold text-lg text-primary">5.8%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
