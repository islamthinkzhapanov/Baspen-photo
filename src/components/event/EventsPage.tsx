"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RiAddLine,
  RiCalendarLine,
  RiMapPinLine,
  RiSearchLine,
  RiCameraLine,
  RiMore2Line,
  RiEditLine,
  RiDeleteBinLine,
  RiFolderOpenLine,
  RiImageLine,
  RiMoneyDollarCircleLine,
} from "@remixicon/react";
import { useState, useRef, useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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

import { useEvents, useDeleteEvent } from "@/hooks/useEvents";
import { CreateProjectModal } from "./CreateProjectModal";

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
  const td = useTranslations("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteEventMutation = useDeleteEvent();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
        setMenuPos(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpenId]);

  const { data: events = [] } = useEvents();

  const eventsArr = events as (Event & { revenue?: number })[];
  const totalPhotos = eventsArr.reduce((sum, e) => sum + (e.photoCount || 0), 0);
  const totalSearches = eventsArr.reduce((sum, e) => sum + (e.searches || 0), 0);
  const totalRevenue = eventsArr.reduce((sum, e) => sum + (e.revenue || 0), 0);

  const stats = [
    { key: "active_projects" as const, value: eventsArr.length, icon: RiFolderOpenLine },
    { key: "total_photos" as const, value: totalPhotos.toLocaleString("ru-RU"), icon: RiImageLine },
    { key: "searches" as const, value: totalSearches.toLocaleString("ru-RU"), icon: RiSearchLine },
    { key: "revenue" as const, value: `${totalRevenue.toLocaleString("ru-RU")} ₸`, icon: RiMoneyDollarCircleLine },
  ];

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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="p-4 flex flex-col gap-2">
              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <Icon size={14} className="text-text-secondary" />
                {td(stat.key)}
              </p>
              <p className="text-3xl font-medium">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        <TextInput
          icon={RiSearchLine}
          placeholder={t("search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs [&>input]:text-sm [&>input]:font-medium"
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
        <button onClick={() => setShowCreateModal(true)} className="sm:ml-auto inline-block">
          <Button icon={() => <RiAddLine size={16} />} className="w-full sm:w-auto">
            {t("create")}
          </Button>
        </button>
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
            <button onClick={() => setShowCreateModal(true)} className="inline-block mt-5">
              <Button icon={() => <RiAddLine size={16} />}>
                {t("create")}
              </Button>
            </button>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-visible">
          <div className="overflow-x-auto overflow-y-visible">
          <Table className="min-w-[500px] [&_td]:text-sm [&_th]:text-sm">
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-12">№</TableHeaderCell>
                <TableHeaderCell>{t("col_project")}</TableHeaderCell>
                <TableHeaderCell className="hidden md:table-cell">{t("col_date")}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t("col_photos")}</TableHeaderCell>
                <TableHeaderCell className="text-right hidden sm:table-cell">{t("col_searches")}</TableHeaderCell>
                <TableHeaderCell className="text-right hidden sm:table-cell">{t("col_participants")}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t("col_status")}</TableHeaderCell>
                <TableHeaderCell className="text-right hidden md:table-cell">{t("col_pricing")}</TableHeaderCell>
                <TableHeaderCell className="w-10" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((event, index) => (
                <TableRow key={event.id}>
                  <TableCell className="tabular-nums text-text-secondary">{index + 1}</TableCell>
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
                  <TableCell className="text-right tabular-nums text-sm">
                    {(event.photoCount || 0).toLocaleString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
                    {(event.searches || 0).toLocaleString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
                    {event.participants || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge color={event.isPublished ? "green" : "gray"} size="xs">
                      {event.isPublished ? t("published") : t("draft")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    <span className="text-sm text-text-secondary">
                      {event.pricingMode === "exclusive" ? t("exclusive") : t("commission")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="relative" ref={menuOpenId === event.id ? menuRef : undefined}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (menuOpenId === event.id) {
                            setMenuOpenId(null);
                            setMenuPos(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            setMenuOpenId(event.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-bg-secondary transition-colors cursor-pointer"
                      >
                        <RiMore2Line size={16} className="text-text-secondary" />
                      </button>
                      {menuOpenId === event.id && (
                        <div
                          className="fixed bg-bg border border-border rounded-lg shadow-lg z-50 min-w-[140px] py-1"
                          style={{ top: menuPos?.top, right: menuPos?.right }}>
                          <Link
                            href={`/events/${event.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg-secondary transition-colors"
                            onClick={() => setMenuOpenId(null)}
                          >
                            <RiEditLine size={14} />
                            {t("edit")}
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteTarget(event.id);
                              setMenuOpenId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                          >
                            <RiDeleteBinLine size={14} />
                            {t("delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <RiSearchLine size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-sm font-medium">{t("no_results")}</p>
              <p className="text-xs text-text-secondary mt-1">{t("no_events_desc")}</p>
            </div>
          )}
        </Card>
      )}
      <CreateProjectModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t("delete_confirm_title")}
        description={t("delete_confirm")}
        confirmText={t("delete")}
        variant="danger"
        isPending={deleteEventMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteEventMutation.mutate(deleteTarget, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
      />
    </div>
  );
}
