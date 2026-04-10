"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RiAddLine,
  RiCalendarLine,
  RiMapPinLine,
  RiSearchLine,
  RiCameraLine,
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
  TextInput,
} from "@tremor/react";

import { useEvents } from "@/hooks/useEvents";

// --- Component ---

type Event = {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
  photoCount: number;
  isPublished: boolean;
  cover: string | null;
  searches: number;
  participants: number;
  pricingMode: string;
};

export function EventsPage() {
  const t = useTranslations("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const { data: events = [] } = useEvents();

  const filtered = (events as Event[]).filter((event) => {
    if (
      searchQuery &&
      !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(event.location || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    if (filter === "published" && !event.isPublished) return false;
    if (filter === "draft" && event.isPublished) return false;

    return true;
  });

  const filterTabs = [
    { key: "all" as const, label: t("filter_all") },
    { key: "published" as const, label: t("filter_published") },
    { key: "draft" as const, label: t("filter_draft") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        <TextInput
          icon={RiSearchLine}
          placeholder={t("search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
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
        <Link href="/events/new" className="sm:ml-auto inline-block">
          <Button icon={() => <RiAddLine size={16} />} className="w-full sm:w-auto">
            {t("create")}
          </Button>
        </Link>
      </div>

      {/* Table */}
      {(events as Event[]).length === 0 ? (
        <Card className="p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <RiCameraLine size={32} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">{t("no_events")}</h2>
            <p className="text-sm text-text-secondary mt-2">{t("no_events_desc")}</p>
            <Link href="/events/new" className="inline-block mt-5">
              <Button icon={() => <RiAddLine size={16} />}>
                {t("create")}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          <Table className="min-w-[500px]">
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
                      <div className="min-w-0">
                        <p className="font-medium group-hover:text-primary transition-colors truncate">
                          {event.title}
                        </p>
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <RiMapPinLine size={12} />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {event.date && (
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <RiCalendarLine size={14} />
                        <span className="text-sm">
                          {new Date(event.date).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(event.photoCount || 0).toLocaleString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    {(event.searches || 0).toLocaleString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    {event.participants || 0}
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
            <div className="py-12 text-center">
              <RiSearchLine size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-sm font-medium">{t("no_results")}</p>
              <p className="text-xs text-text-secondary mt-1">{t("no_events_desc")}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
