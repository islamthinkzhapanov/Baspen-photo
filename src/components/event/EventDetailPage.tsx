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
import { useState } from "react";
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

// --- Demo data ---

const demoEvents: Record<
  string,
  {
    id: string;
    title: string;
    slug: string;
    description: string;
    date: string;
    location: string;
    isPublished: boolean;
    pricingMode: string;
    photoCount: number;
    searches: number;
    participants: number;
    downloads: number;
    revenue: number;
    freeDownload: boolean;
    watermark: boolean;
    pricePerPhoto: number;
    packageDiscount: number;
  }
> = {
  "1": {
    id: "1",
    title: "Almaty Marathon 2026",
    slug: "almaty-marathon-2026",
    description: "Ежегодный марафон в Алматы — 42 км, 21 км, 10 км, 5 км",
    date: "2026-03-30",
    location: "Алматы, пр. Абая",
    isPublished: true,
    pricingMode: "commission",
    photoCount: 4200,
    searches: 1580,
    participants: 320,
    downloads: 486,
    revenue: 185000,
    freeDownload: false,
    watermark: true,
    pricePerPhoto: 1200,
    packageDiscount: 30,
  },
  "2": {
    id: "2",
    title: "Nauryz Festival",
    slug: "nauryz-festival",
    description: "Празднование Наурыза — концерты, конкурсы, национальная кухня",
    date: "2026-03-22",
    location: "Астана, EXPO",
    isPublished: true,
    pricingMode: "exclusive",
    photoCount: 3100,
    searches: 890,
    participants: 245,
    downloads: 312,
    revenue: 124500,
    freeDownload: false,
    watermark: true,
    pricePerPhoto: 800,
    packageDiscount: 25,
  },
  "3": {
    id: "3",
    title: "Tech Conference KZ",
    slug: "tech-conf-kz",
    description: "IT-конференция для разработчиков и стартапов Казахстана",
    date: "2026-03-15",
    location: "Алматы, Rixos",
    isPublished: false,
    pricingMode: "commission",
    photoCount: 2800,
    searches: 520,
    participants: 180,
    downloads: 95,
    revenue: 78000,
    freeDownload: false,
    watermark: true,
    pricePerPhoto: 1000,
    packageDiscount: 20,
  },
  "4": {
    id: "4",
    title: "Корпоратив Kaspi",
    slug: "kaspi-corp",
    description: "Корпоративное мероприятие для сотрудников Kaspi.kz",
    date: "2026-03-08",
    location: "Алматы, The Ritz",
    isPublished: true,
    pricingMode: "exclusive",
    photoCount: 1580,
    searches: 210,
    participants: 95,
    downloads: 78,
    revenue: 41000,
    freeDownload: true,
    watermark: false,
    pricePerPhoto: 0,
    packageDiscount: 0,
  },
  "5": {
    id: "5",
    title: "Свадьба Арман & Айгуль",
    slug: "arman-aigul-wedding",
    description: "Свадебное торжество",
    date: "2026-04-12",
    location: "Алматы, Tau House",
    isPublished: false,
    pricingMode: "exclusive",
    photoCount: 0,
    searches: 0,
    participants: 0,
    downloads: 0,
    revenue: 0,
    freeDownload: true,
    watermark: false,
    pricePerPhoto: 0,
    packageDiscount: 0,
  },
};

const demoMembers = [
  { id: "m1", name: "Арман Сериков", email: "arman@baspen.kz", role: "owner" },
  { id: "m2", name: "Дана Алиева", email: "dana@photo.kz", role: "photographer" },
  { id: "m3", name: "Бекзат Тулеев", email: "bekzat@photo.kz", role: "photographer" },
];

const demoPhotos = Array.from({ length: 12 }, (_, i) => ({
  id: `p${i + 1}`,
  index: i + 1,
}));

const chartData = [
  { date: "22 мар", searches: 45, downloads: 12 },
  { date: "23 мар", searches: 78, downloads: 28 },
  { date: "24 мар", searches: 120, downloads: 45 },
  { date: "25 мар", searches: 95, downloads: 38 },
  { date: "26 мар", searches: 180, downloads: 62 },
  { date: "27 мар", searches: 210, downloads: 78 },
  { date: "28 мар", searches: 155, downloads: 52 },
  { date: "29 мар", searches: 290, downloads: 95 },
  { date: "30 мар", searches: 420, downloads: 142 },
];

// --- Component ---

export function EventDetailPage({ eventId }: { eventId: string }) {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const ta = useTranslations("analytics");
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [freeDownloadToggle, setFreeDownloadToggle] = useState(false);
  const [watermarkToggle, setWatermarkToggle] = useState(true);

  const event = demoEvents[eventId];

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Проект не найден</p>
        <Link href="/events" className="text-primary text-sm mt-2 inline-block">
          ← Назад к проектам
        </Link>
      </div>
    );
  }

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

  const stats = [
    { key: "photos", label: t("photos"), value: event.photoCount, icon: statIcons.photos, color: "text-primary" },
    { key: "searches", label: ta("total_searches"), value: event.searches, icon: statIcons.searches, color: "text-amber-600" },
    { key: "downloads", label: ta("total_downloads"), value: event.downloads, icon: statIcons.downloads, color: "text-emerald-600" },
    { key: "revenue", label: ta("total_revenue"), value: `${event.revenue.toLocaleString("ru-RU")} ₸`, icon: statIcons.revenue, color: "text-violet-600" },
  ];

  return (
    <div className="max-w-[1000px]">
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
          <p className="text-sm text-text-secondary mt-1">{event.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <RiCalendarLine size={14} />
              {new Date(event.date).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <RiMapPinLine size={14} />
              {event.location}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={copyLink} icon={copied ? RiCheckLine : RiFileCopyLine} size="sm">
            {t("copy_link")}
          </Button>
          <Button variant="secondary" icon={RiQrCodeLine} size="sm">
            QR
          </Button>
          <Button icon={event.isPublished ? RiGlobalLine : RiGlobalLine} size="sm">
            {event.isPublished ? t("unpublish") : t("publish")}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
        <TabList>
          <Tab icon={RiImageLine}>Фото</Tab>
          <Tab icon={RiGroupLine}>Команда</Tab>
          <Tab icon={RiBarChart2Line}>Аналитика</Tab>
          <Tab icon={RiSettings3Line}>Настройки</Tab>
        </TabList>
        <TabPanels>
          {/* Photos Tab */}
          <TabPanel>
            <div className="space-y-4">
              {/* Upload Zone */}
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <RiUploadLine size={32} className="text-text-secondary mx-auto mb-2" />
                <p className="text-sm font-medium">Перетащите фото сюда</p>
                <p className="text-xs text-text-secondary mt-1">JPG, PNG, WebP до 50 МБ</p>
              </div>

              {/* Photo Grid */}
              {event.photoCount > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {demoPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group relative overflow-hidden cursor-pointer"
                    >
                      <RiImageLine size={24} className="text-gray-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <RiEyeLine size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[10px] text-gray-400">
                        #{photo.index}
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

              {event.photoCount > 12 && (
                <p className="text-center text-xs text-text-secondary">
                  Показано 12 из {event.photoCount.toLocaleString("ru-RU")} фото
                </p>
              )}
            </div>
          </TabPanel>

          {/* Team Tab */}
          <TabPanel>
            <div className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setInviteEmail("");
                }}
                className="flex gap-2"
              >
                <TextInput
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t("invite_email")}
                  className="flex-1"
                />
                <span className="flex items-center px-3 py-2 border border-tremor-border rounded-tremor-default text-sm">
                  {t("role_photographer")}
                </span>
                <Button type="submit" icon={RiUserAddLine} size="sm">
                  {t("invite_member")}
                </Button>
              </form>

              <div className="space-y-2">
                {demoMembers.map((m) => (
                  <Card
                    key={m.id}
                    className="flex items-center justify-between py-3 px-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                        {(m.name || m.email).charAt(0).toUpperCase()}
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
              </div>
            </div>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel>
            <div className="space-y-6">
              {/* Chart */}
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

              {/* Conversion funnel */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4">Воронка</h3>
                <div className="flex items-center gap-6">
                  {[
                    { label: "Посетители", value: event.participants + event.searches },
                    { label: "Искали фото", value: event.searches },
                    { label: "Скачали", value: event.downloads },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xl font-bold">{step.value.toLocaleString("ru-RU")}</p>
                        <p className="text-xs text-text-secondary">{step.label}</p>
                      </div>
                      {i < 2 && <span className="text-text-secondary">→</span>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel>
            <div className="space-y-6">
              {/* General */}
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
                  <Textarea defaultValue={event.description} rows={3} />
                </div>
              </Card>

              {/* Pricing */}
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
                      <NumberInput defaultValue={event.pricePerPhoto} className="w-40" />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">{t("package_discount")}</label>
                      <NumberInput defaultValue={event.packageDiscount} className="w-40" />
                    </div>
                  </>
                )}
              </Card>

              <div className="flex justify-end">
                <Button>{tc("save")}</Button>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
