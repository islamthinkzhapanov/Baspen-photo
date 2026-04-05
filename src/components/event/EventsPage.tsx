"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RiAddLine,
  RiCalendarLine,
  RiMapPinLine,
  RiImageLine,
  RiDeleteBinLine,
  RiEditLine,
  RiGroupLine,
  RiSearchLine,
  RiCameraLine,
  RiEyeLine,
} from "@remixicon/react";
import { useState } from "react";
import {
  Badge,
  Card,
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";

// --- Demo data ---

const demoEvents = [
  {
    id: "1",
    title: "Almaty Marathon 2026",
    date: "2026-03-30",
    location: "Алматы, пр. Абая",
    photoCount: 4200,
    isPublished: true,
    cover: null,
    searches: 1580,
    participants: 320,
    pricingMode: "commission",
  },
  {
    id: "2",
    title: "Nauryz Festival",
    date: "2026-03-22",
    location: "Астана, EXPO",
    photoCount: 3100,
    isPublished: true,
    cover: null,
    searches: 890,
    participants: 245,
    pricingMode: "exclusive",
  },
  {
    id: "3",
    title: "Tech Conference KZ",
    date: "2026-03-15",
    location: "Алматы, Rixos",
    photoCount: 2800,
    isPublished: false,
    cover: null,
    searches: 520,
    participants: 180,
    pricingMode: "commission",
  },
  {
    id: "4",
    title: "Корпоратив Kaspi",
    date: "2026-03-08",
    location: "Алматы, The Ritz",
    photoCount: 1580,
    isPublished: true,
    cover: null,
    searches: 210,
    participants: 95,
    pricingMode: "exclusive",
  },
  {
    id: "5",
    title: "Свадьба Арман & Айгуль",
    date: "2026-04-12",
    location: "Алматы, Tau House",
    photoCount: 0,
    isPublished: false,
    cover: null,
    searches: 0,
    participants: 0,
    pricingMode: "exclusive",
  },
];

// --- Aggregated stats ---

const totalPhotos = demoEvents.reduce((sum, e) => sum + e.photoCount, 0);
const totalSearches = demoEvents.reduce((sum, e) => sum + e.searches, 0);
const totalParticipants = demoEvents.reduce((sum, e) => sum + e.participants, 0);

// --- Component ---

export function EventsPage() {
  const t = useTranslations("events");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = demoEvents.filter((event) => {
    if (filter === "published" && !event.isPublished) return false;
    if (filter === "draft" && event.isPublished) return false;
    if (
      searchQuery &&
      !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !event.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const filterTabs = [
    { key: "all" as const, label: t("filter_all") },
    { key: "published" as const, label: t("filter_published") },
    { key: "draft" as const, label: t("filter_draft") },
  ];

  const statCards = [
    {
      label: t("total_projects"),
      value: demoEvents.length,
      icon: RiCameraLine,
      color: "bg-primary/10 text-primary",
    },
    {
      label: t("total_photos"),
      value: totalPhotos.toLocaleString("ru-RU"),
      icon: RiImageLine,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: t("total_searches"),
      value: totalSearches.toLocaleString("ru-RU"),
      icon: RiEyeLine,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: t("total_participants"),
      value: totalParticipants.toLocaleString("ru-RU"),
      icon: RiGroupLine,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
        </div>
        <Link href="/events/new">
          <Button icon={() => <RiAddLine size={16} />}>
            {t("create")}
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-bg-secondary rounded-lg p-1 gap-0.5 w-fit">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === tab.key
                  ? "bg-bg text-text font-medium shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-bg placeholder:text-text-secondary focus:outline-none focus:border-border-active transition-colors"
          />
        </div>
        <Link href="/events/new">
          <Button icon={() => <RiAddLine size={16} />}>
            {t("create")}
          </Button>
        </Link>
      </div>

      {/* Projects Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("col_project")}</TableHeaderCell>
              <TableHeaderCell className="hidden md:table-cell">{t("col_date")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("col_photos")}</TableHeaderCell>
              <TableHeaderCell className="text-right hidden sm:table-cell">{t("col_searches")}</TableHeaderCell>
              <TableHeaderCell className="text-right hidden sm:table-cell">{t("col_participants")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("col_status")}</TableHeaderCell>
              <TableHeaderCell className="text-right hidden md:table-cell">{t("col_pricing")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <Link href={`/events/${event.id}`} className="group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center flex-shrink-0">
                        <RiImageLine size={18} className="text-primary/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium group-hover:text-primary transition-colors truncate">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                          <RiMapPinLine size={12} />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <RiCalendarLine size={14} />
                    <span className="text-sm">
                      {new Date(event.date).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {event.photoCount.toLocaleString("ru-RU")}
                </TableCell>
                <TableCell className="text-right tabular-nums hidden sm:table-cell">
                  {event.searches.toLocaleString("ru-RU")}
                </TableCell>
                <TableCell className="text-right tabular-nums hidden sm:table-cell">
                  {event.participants}
                </TableCell>
                <TableCell className="text-right">
                  <Badge color={event.isPublished ? "green" : "gray"} size="xs">
                    {event.isPublished ? t("published") : t("draft")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <span className="text-xs text-text-secondary">
                    {event.pricingMode === "exclusive" ? t("exclusive") : t("commission")}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-text-secondary text-sm">
            {t("no_results")}
          </div>
        )}
      </Card>
    </div>
  );
}
