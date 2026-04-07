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
  RiUploadLine,
  RiGroupLine,
  RiBarChart2Line,
  RiSettings3Line,
  RiSearchLine,
  RiDownloadLine,
  RiEyeLine,
  RiArrowUpLine,
  RiCalendarLine,
  RiMapPinLine,
} from "@remixicon/react";
import { useRef, useState } from "react";
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
import { useEventPhotos, useUploadPhotos } from "@/hooks/usePhotos";
import { useEventAnalytics } from "@/hooks/useAnalytics";

// --- Component ---

export function EventDetailPage({ eventId }: { eventId: string }) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const ta = useTranslations("analytics");
  const { isEventPhotographer: isPhotographer } = useEventRole(eventId);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [freeDownloadToggle, setFreeDownloadToggle] = useState(false);
  const [watermarkToggle, setWatermarkToggle] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPhotos = useUploadPhotos(eventId);

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

  const photos = photosData?.photos || [];
  const chartData = analytics?.chartData || [];

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
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) uploadPhotos.mutate(files);
                    e.target.value = "";
                  }}
                />
                <RiUploadLine size={32} className="text-text-secondary mx-auto mb-2" />
                <p className="text-sm font-medium">Перетащите фото сюда</p>
                <p className="text-xs text-text-secondary mt-1">JPG, PNG, WebP до 50 МБ</p>
              </div>

              {/* Photo Grid */}
              {photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {photos.slice(0, 12).map((photo: { id: string }, index: number) => (
                    <div
                      key={photo.id}
                      className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group relative overflow-hidden cursor-pointer"
                    >
                      <RiImageLine size={24} className="text-gray-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <RiEyeLine size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[10px] text-gray-400">
                        #{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <RiImageLine size={40} className="text-text-secondary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">Загрузите первые фото в этот проект</p>
                </div>
              )}

              {(event.photoCount || 0) > 12 && (
                <p className="text-center text-xs text-text-secondary">
                  Показано 12 из {(event.photoCount || 0).toLocaleString("ru-RU")} фото
                </p>
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
    </div>
  );
}
