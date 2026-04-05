"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RiAddLine,
  RiCalendarLine,
  RiMapPinLine,
  RiImageLine,
  RiMore2Line,
  RiDeleteBinLine,
  RiEditLine,
  RiGroupLine,
  RiSearchLine,
} from "@remixicon/react";
import { useState } from "react";
import { Badge, Card, Button } from "@tremor/react";

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

// --- Component ---

export function EventsPage() {
  const t = useTranslations("events");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <Link href="/events/new">
          <Button icon={RiAddLine}>
            {t("create")}
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demoEvents.map((event) => (
          <Card
            key={event.id}
            className="p-4 hover:shadow-sm transition-shadow relative group"
          >
            {/* Cover placeholder */}
            <div className="h-32 bg-gradient-to-br from-primary/5 to-primary/15 rounded-lg mb-3 flex items-center justify-center">
              <RiImageLine size={32} className="text-primary/30" />
            </div>

            <div className="flex items-start justify-between mb-2">
              <Link
                href={`/events/${event.id}`}
                className="text-base font-semibold hover:text-primary line-clamp-1"
              >
                {event.title}
              </Link>
              <div className="relative">
                <button
                  onClick={() =>
                    setMenuOpen(menuOpen === event.id ? null : event.id)
                  }
                  className="p-1 hover:bg-bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RiMore2Line size={16} />
                </button>
                {menuOpen === event.id && (
                  <div className="absolute right-0 top-8 bg-bg border border-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                    <Link
                      href={`/events/${event.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-secondary"
                    >
                      <RiEditLine size={16} />
                      {t("edit_event")}
                    </Link>
                    <button
                      onClick={() => setMenuOpen(null)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <RiDeleteBinLine size={16} />
                      {t("delete")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-sm text-text-secondary">
              <div className="flex items-center gap-1.5">
                <RiCalendarLine size={14} />
                {new Date(event.date).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-1.5">
                <RiMapPinLine size={14} />
                {event.location}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <RiImageLine size={12} />
                {event.photoCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <RiSearchLine size={12} />
                {event.searches.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <RiGroupLine size={12} />
                {event.participants}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <Badge color={event.isPublished ? "green" : "gray"}>
                {event.isPublished ? t("published") : t("draft")}
              </Badge>
              <span className="text-xs text-text-secondary">
                {event.pricingMode === "exclusive" ? t("exclusive") : t("commission")}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
