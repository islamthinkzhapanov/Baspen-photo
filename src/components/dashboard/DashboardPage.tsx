"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RiCameraLine,
  RiAddLine,
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
    { key: "active_projects", value: eventsArr.length },
    { key: "total_photos", value: totalPhotos.toLocaleString("ru-RU") },
    { key: "searches", value: totalSearches.toLocaleString("ru-RU") },
    { key: "revenue", value: `${totalRevenue.toLocaleString("ru-RU")} ₸` },
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
        {stats.map((stat) => (
            <Card key={stat.key} className="p-4 flex flex-col gap-2">
              <p className="text-xs text-text-secondary">{t(`dashboard.${stat.key}`)}</p>
              <p className="text-3xl font-medium" suppressHydrationWarning>{stat.value}</p>
            </Card>
          ))}
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
