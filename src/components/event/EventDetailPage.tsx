"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  RiArrowLeftLine,
  RiFileCopyLine,
  RiCheckLine,
  RiQrCodeLine,
  RiUserAddLine,
  RiGlobalLine,
  RiImageLine,
  RiGroupLine,
  RiBarChart2Line,
  RiSettings3Line,
  RiSearchLine,
  RiDownloadLine,
  RiEyeLine,
  RiDeleteBinLine,
  RiArrowUpLine,
  RiCalendarLine,
  RiMapPinLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiLoader4Line,
  RiCheckboxLine,
  RiCheckboxBlankLine,
  RiCheckboxFill,
} from "@remixicon/react";
import { useRef, useState, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { Lightbox } from "@/components/gallery/Lightbox";
import {
  Card,
  Badge,
  Button,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@tremor/react";
import { LineChart } from "@/components/charts";
import { useEventRole } from "@/hooks/useEventRole";
import { useEvent, useEventMembers } from "@/hooks/useEvents";
import { useEventPhotos, useDeletePhoto, useBulkDeletePhotos, useProcessingStatus } from "@/hooks/usePhotos";
import { useEventAnalytics } from "@/hooks/useAnalytics";
import { PhotoUploadZone } from "@/components/upload/PhotoUploadZone";

const PHOTOS_PER_PAGE = 100;

interface Photo {
  id: string;
  thumbnailPath: string | null;
  watermarkedPath?: string | null;
  storagePath: string;
  originalFilename: string | null;
  status?: string;
}

/* ─── Pagination ─── */

function Pagination({
  currentPage,
  totalItems,
  perPage,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / perPage);
  const [inputValue, setInputValue] = useState(String(currentPage));

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(totalPages, page));
      onPageChange(clamped);
      setInputValue(String(clamped));
    },
    [totalPages, onPageChange]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setInputValue(raw);
  };

  const handleInputCommit = () => {
    const num = parseInt(inputValue, 10);
    if (!num || isNaN(num)) {
      setInputValue(String(currentPage));
      return;
    }
    goToPage(num);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
      handleInputCommit();
    }
  };

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <span className="text-xs text-text-secondary tabular-nums">
        {from}&ndash;{to} / {totalItems.toLocaleString("ru-RU")}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border
            hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <RiArrowLeftSLine size={18} />
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputCommit}
          onKeyDown={handleKeyDown}
          className="h-8 w-12 rounded-lg border border-border bg-bg text-center text-sm font-medium
            text-text tabular-nums outline-none
            focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border
            hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <RiArrowRightSLine size={18} />
        </button>
      </div>
    </div>
  );
}

/* ─── Processing Status Bar ─── */

function ProcessingBar({ eventId }: { eventId: string }) {
  const tp = useTranslations("photographer");
  const { data: status } = useProcessingStatus(eventId);

  if (!status || status.processing === 0) return null;

  const percent = Math.round(((status.ready + status.failed) / status.total) * 100);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl text-sm">
      <RiLoader4Line size={16} className="text-primary animate-spin shrink-0" />
      <span className="text-text-secondary">
        {tp("processing_status", {
          ready: status.ready,
          total: status.total,
        })}
      </span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {status.failed > 0 && (
        <span className="text-xs text-red-500">
          {status.failed} {tp("failed")}
        </span>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export function EventDetailPage({ eventId }: { eventId: string }) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const ta = useTranslations("analytics");
  const tp = useTranslations("photographer");
  const { isEventPhotographer: isPhotographer } = useEventRole(eventId);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [freeDownloadToggle, setFreeDownloadToggle] = useState(false);
  const [watermarkToggle, setWatermarkToggle] = useState(true);

  const deleteMutation = useDeletePhoto(eventId);
  const bulkDeleteMutation = useBulkDeletePhotos(eventId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pagination & selection
  const [currentPage, setCurrentPage] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<"selected" | "all" | null>(null);

  const { data: event } = useEvent(eventId);
  const { data: members = [] } = useEventMembers(eventId);
  const { data: photosData } = useEventPhotos(eventId);
  const { data: analytics } = useEventAnalytics(eventId);

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">{tc("loading")}</p>
      </div>
    );
  }

  const photos: Photo[] = photosData?.photos || [];
  const readyPhotos = photos.filter((p) => p.status === "ready");
  const chartData = analytics?.chartData || [];

  const pagePhotos = readyPhotos.slice(
    (currentPage - 1) * PHOTOS_PER_PAGE,
    currentPage * PHOTOS_PER_PAGE
  );

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/e/${event.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statIcons: Record<string, typeof RiImageLine> = {
    photos: RiImageLine,
    searches: RiSearchLine,
    downloads: RiDownloadLine,
    revenue: RiArrowUpLine,
  };

  const allStats = [
    { key: "photos", label: t("photos"), value: event.photoCount || 0, icon: statIcons.photos, color: "text-primary" },
    { key: "searches", label: ta("total_searches"), value: event.searches || 0, icon: statIcons.searches, color: "text-amber-600" },
    { key: "downloads", label: ta("total_downloads"), value: event.downloads || 0, icon: statIcons.downloads, color: "text-emerald-600" },
    { key: "revenue", label: ta("total_revenue"), value: `${(event.revenue || 0).toLocaleString("ru-RU")} ₸`, icon: statIcons.revenue, color: "text-violet-600", ownerOnly: true },
  ];

  const stats = isPhotographer
    ? allStats.filter((s) => !s.ownerOnly)
    : allStats;

  // Selection helpers
  const handlePhotoClick = (pageIndex: number) => {
    if (selectionMode) {
      toggleSelect(pagePhotos[pageIndex].id);
      return;
    }
    setLightboxIndex(pageIndex);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pagePhotos.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const deselectAll = () => setSelectedIds(new Set());

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const allOnPageSelected = pagePhotos.length > 0 && pagePhotos.every((p) => selectedIds.has(p.id));

  const handleBulkDelete = () => {
    if (confirmAction === "all") {
      bulkDeleteMutation.mutate(
        { all: true },
        {
          onSuccess: () => {
            setConfirmAction(null);
            exitSelectionMode();
            setCurrentPage(1);
          },
        }
      );
    } else if (confirmAction === "selected") {
      bulkDeleteMutation.mutate(
        { photoIds: Array.from(selectedIds) },
        {
          onSuccess: () => {
            setConfirmAction(null);
            exitSelectionMode();
          },
        }
      );
    }
  };

  return (
    <div className="max-w-[1000px] w-full">
      {/* Back */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-4"
      >
        <RiArrowLeftLine size={16} />
        {tc("back")}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display">{event.title}</h1>
            <Badge color={event.isPublished ? "green" : "gray"}>
              {event.isPublished ? t("published") : t("draft")}
            </Badge>
          </div>
          {event.description && (
            <p className="text-sm text-text-secondary mt-1">{event.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
            {event.date && (
              <span className="flex items-center gap-1">
                <RiCalendarLine size={14} />
                {new Date(event.date).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <RiMapPinLine size={14} />
                {event.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap w-full sm:w-auto">
          <Button variant="secondary" onClick={copyLink} icon={copied ? RiCheckLine : RiFileCopyLine} size="sm" className="text-xs sm:text-sm">
            {t("copy_link")}
          </Button>
          <Button variant="secondary" icon={RiQrCodeLine} size="sm" className="text-xs sm:text-sm">
            QR
          </Button>
          {!isPhotographer && (
            <Button icon={event.isPublished ? RiGlobalLine : RiGlobalLine} size="sm" className="text-xs sm:text-sm">
              {event.isPublished ? t("unpublish") : t("publish")}
            </Button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={stat.color} />
                <span className="text-xs text-text-secondary">{stat.label}</span>
              </div>
              <p className="text-lg font-bold">
                {typeof stat.value === "number" ? stat.value.toLocaleString("ru-RU") : stat.value}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <TabGroup>
        <TabList className="overflow-x-auto overflow-y-hidden flex-nowrap whitespace-nowrap [&>button]:shrink-0">
          {[
            { icon: RiImageLine, label: t("photos"), show: true },
            { icon: RiGroupLine, label: t("team"), show: true },
            { icon: RiBarChart2Line, label: ta("title"), show: !isPhotographer },
            { icon: RiSettings3Line, label: t("settings"), show: !isPhotographer },
          ]
            .filter((tab) => tab.show)
            .map((tab) => (
              <Tab key={tab.label} icon={tab.icon}>
                {tab.label}
              </Tab>
            ))}
        </TabList>
        <TabPanels>
          {/* Photos Tab */}
          <TabPanel>
            <div className="space-y-4">
              {/* Upload Zone */}
              <PhotoUploadZone eventId={eventId} />

              {/* Processing status */}
              <ProcessingBar eventId={eventId} />

              {/* Photo count + actions */}
              {readyPhotos.length > 0 && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text">
                    <RiImageLine size={16} className="text-text-secondary" />
                    {tp("uploaded_count", { count: readyPhotos.length.toLocaleString("ru-RU") })}
                  </span>

                  <div className="flex items-center gap-2">
                    {!selectionMode ? (
                      <>
                        <button
                          onClick={() => setSelectionMode(true)}
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-border
                            hover:bg-bg-secondary transition-colors cursor-pointer
                            flex items-center gap-1.5"
                        >
                          <RiCheckboxLine size={14} />
                          {tp("select")}
                        </button>
                        <button
                          onClick={() => setConfirmAction("all")}
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-red-200
                            text-red-500 hover:bg-red-50 transition-colors cursor-pointer
                            flex items-center gap-1.5"
                        >
                          <RiDeleteBinLine size={14} />
                          {tp("delete_all")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={allOnPageSelected ? deselectAll : selectAllOnPage}
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-border
                            hover:bg-bg-secondary transition-colors cursor-pointer
                            flex items-center gap-1.5"
                        >
                          {allOnPageSelected ? (
                            <RiCheckboxFill size={14} className="text-primary" />
                          ) : (
                            <RiCheckboxBlankLine size={14} />
                          )}
                          {allOnPageSelected ? tp("deselect_all") : tp("select_all_page")}
                        </button>

                        {selectedIds.size > 0 && (
                          <button
                            onClick={() => setConfirmAction("selected")}
                            className="h-8 px-3 text-xs font-medium rounded-lg
                              bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer
                              flex items-center gap-1.5"
                          >
                            <RiDeleteBinLine size={14} />
                            {tp("delete_selected", { count: selectedIds.size })}
                          </button>
                        )}

                        <button
                          onClick={exitSelectionMode}
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-border
                            hover:bg-bg-secondary transition-colors cursor-pointer"
                        >
                          {tc("cancel")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Photo Grid */}
              {readyPhotos.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {pagePhotos.map((photo, index) => {
                      const thumbUrl = photo.thumbnailPath || photo.watermarkedPath;
                      const isSelected = selectedIds.has(photo.id);
                      return (
                        <div
                          key={photo.id}
                          className={`aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group relative overflow-hidden cursor-pointer
                            ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                          onClick={() => handlePhotoClick(index)}
                        >
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={photo.originalFilename || `Photo ${index + 1}`}
                              className="absolute inset-0 w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <RiImageLine size={24} className="text-gray-300" />
                          )}

                          {/* Selection checkbox */}
                          {selectionMode && (
                            <div className="absolute top-1.5 left-1.5 z-10">
                              {isSelected ? (
                                <RiCheckboxFill size={22} className="text-primary drop-shadow-md" />
                              ) : (
                                <RiCheckboxBlankLine size={22} className="text-white drop-shadow-md" />
                              )}
                            </div>
                          )}

                          {/* Hover overlay (only when not in selection mode) */}
                          {!selectionMode && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                                className="p-2 bg-white/90 hover:bg-white rounded-full text-gray-800 transition-colors cursor-pointer"
                              >
                                <RiEyeLine size={18} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(photo.id); }}
                                className="p-2 bg-white/90 hover:bg-white rounded-full text-red-500 transition-colors cursor-pointer"
                              >
                                <RiDeleteBinLine size={18} />
                              </button>
                            </div>
                          )}

                          {/* Dim overlay for selected */}
                          {selectionMode && isSelected && (
                            <div className="absolute inset-0 bg-primary/10" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalItems={readyPhotos.length}
                    perPage={PHOTOS_PER_PAGE}
                    onPageChange={setCurrentPage}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <RiImageLine size={40} className="text-text-secondary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">{tp("empty_desc")}</p>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Team Tab */}
          <TabPanel>
            <div className="space-y-4">
              {!isPhotographer && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setInviteEmail("");
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <TextInput
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t("invite_email")}
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 py-2 border border-tremor-border rounded-tremor-default text-sm">
                      {t("role_photographer")}
                    </span>
                    <Button type="submit" icon={RiUserAddLine} size="sm">
                      {t("invite_member")}
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {(members as { id: string; name: string | null; email: string; role: string }[]).map((m) => (
                  <Card
                    key={m.id}
                    className="flex items-center justify-between py-3 px-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                        {(m.name || m.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.name || m.email}</p>
                        {m.name && <p className="text-xs text-text-secondary">{m.email}</p>}
                      </div>
                    </div>
                    <Badge color={m.role === "owner" ? "blue" : "amber"}>
                      {m.role === "owner"
                        ? t("role_owner")
                        : t("role_photographer")}
                    </Badge>
                  </Card>
                ))}
                {(members as unknown[]).length === 0 && (
                  <p className="text-center text-sm text-text-secondary py-8">
                    {t("no_members")}
                  </p>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Analytics Tab (Owner only) */}
          {!isPhotographer && (
            <TabPanel>
              <div className="space-y-6">
                {chartData.length > 0 ? (
                  <Card className="p-5">
                    <h3 className="text-sm font-semibold mb-4">Поиски и скачивания</h3>
                    <LineChart
                      data={chartData}
                      index="date"
                      categories={["searches", "downloads"]}
                      colors={["blue", "green"]}
                      yAxisWidth={40}
                      className="h-64"
                    />
                  </Card>
                ) : (
                  <Card className="p-5">
                    <div className="text-center py-8">
                      <RiBarChart2Line size={32} className="text-text-secondary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">{ta("no_data")}</p>
                    </div>
                  </Card>
                )}

                <Card className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Воронка</h3>
                  <div className="flex items-center justify-between gap-2 sm:gap-6 sm:justify-start">
                    {[
                      { label: "Посетители", value: (event.participants || 0) + (event.searches || 0) },
                      { label: "Искали фото", value: event.searches || 0 },
                      { label: "Скачали", value: event.downloads || 0 },
                    ].map((step, i) => (
                      <div key={step.label} className="flex items-center gap-2 sm:gap-4">
                        <div className="text-center">
                          <p className="text-lg sm:text-xl font-bold">{step.value.toLocaleString("ru-RU")}</p>
                          <p className="text-xs text-text-secondary">{step.label}</p>
                        </div>
                        {i < 2 && <span className="text-text-secondary">→</span>}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabPanel>
          )}

          {/* Settings Tab (Owner only) */}
          {!isPhotographer && (
            <TabPanel>
              <div className="space-y-6">
                <Card className="p-5 space-y-4">
                  <h3 className="text-sm font-semibold">Основное</h3>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">{t("event_name")}</label>
                    <TextInput defaultValue={event.title} />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">{t("slug")}</label>
                    <TextInput defaultValue={event.slug} />
                    <p className="text-xs text-text-secondary mt-1">{t("slug_hint")}</p>
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">{t("event_description")}</label>
                    <Textarea defaultValue={event.description || ""} rows={3} />
                  </div>
                </Card>

                <Card className="p-5 space-y-4">
                  <h3 className="text-sm font-semibold">Продажи</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">{t("free_download")}</p>
                      <p className="text-xs text-text-secondary">Участники скачивают бесплатно</p>
                    </div>
                    <Switch
                      checked={freeDownloadToggle}
                      onChange={setFreeDownloadToggle}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">{t("watermark")}</p>
                      <p className="text-xs text-text-secondary">Водяной знак на превью</p>
                    </div>
                    <Switch
                      checked={watermarkToggle}
                      onChange={setWatermarkToggle}
                    />
                  </div>
                  {!freeDownloadToggle && (
                    <>
                      <div>
                        <label className="text-xs text-text-secondary block mb-1">{t("price_per_photo")} (₸)</label>
                        <NumberInput defaultValue={event.pricePerPhoto || 0} className="w-40" />
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary block mb-1">{t("package_discount")}</label>
                        <NumberInput defaultValue={event.packageDiscount || 0} className="w-40" />
                      </div>
                    </>
                  )}
                </Card>

                <div className="flex justify-end">
                  <Button>{tc("save")}</Button>
                </div>
              </div>
            </TabPanel>
          )}
        </TabPanels>
      </TabGroup>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={pagePhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
          onDelete={(photoId) => setDeleteConfirmId(photoId)}
        />
      )}

      {/* Single delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-bg rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-text mb-1">
              {tp("delete_confirm")}
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              {tp("delete_confirm_desc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                  hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deleteConfirmId, {
                    onSuccess: () => {
                      if (lightboxIndex !== null) {
                        if (pagePhotos.length <= 1) {
                          setLightboxIndex(null);
                        } else if (lightboxIndex >= pagePhotos.length - 1 && lightboxIndex > 0) {
                          setLightboxIndex(lightboxIndex - 1);
                        }
                      }
                      setDeleteConfirmId(null);
                    },
                  });
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium
                  hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {tp("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-bg rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-text mb-1">
              {confirmAction === "all"
                ? tp("delete_all_confirm", { count: readyPhotos.length })
                : tp("delete_selected_confirm", { count: selectedIds.size })}
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              {tp("delete_bulk_desc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={bulkDeleteMutation.isPending}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                  hover:bg-bg-secondary transition-colors cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium
                  hover:bg-red-600 transition-colors cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {bulkDeleteMutation.isPending && (
                  <RiLoader4Line size={16} className="animate-spin" />
                )}
                {tp("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
