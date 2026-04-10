"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RiCameraLine,
  RiSearchLine,
  RiArrowUpLine,
  RiAddLine,
  RiImageLine,
} from "@remixicon/react";
import {
  Card,
  Button,
} from "@tremor/react";
import { useEvents } from "@/hooks/useEvents";

type Event = {
  id: string;
  title: string;
  date: string | null;
  photoCount: number;
  searches: number;
  participants: number;
  revenue: number;
  isPublished: boolean;
};

export function DashboardPage() {
  const t = useTranslations();
  const { data: events = [] } = useEvents();

  const eventsArr = events as Event[];
  const totalPhotos = eventsArr.reduce((sum, e) => sum + (e.photoCount || 0), 0);
  const totalSearches = eventsArr.reduce((sum, e) => sum + (e.searches || 0), 0);
  const totalRevenue = eventsArr.reduce((sum, e) => sum + (e.revenue || 0), 0);

  const stats = [
    {
      key: "active_projects",
      value: eventsArr.length,
      icon: RiCameraLine,
      color: "bg-primary/10 text-primary",
    },
    {
      key: "total_photos",
      value: totalPhotos.toLocaleString("ru-RU"),
      icon: RiImageLine,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      key: "searches",
      value: totalSearches.toLocaleString("ru-RU"),
      icon: RiSearchLine,
      color: "bg-amber-50 text-amber-600",
    },
    {
      key: "revenue",
      value: `${totalRevenue.toLocaleString("ru-RU")} ₸`,
      icon: RiArrowUpLine,
      color: "bg-violet-50 text-violet-600",
    },
  ];

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
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{t(`dashboard.${stat.key}`)}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {eventsArr.length === 0 && (
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
