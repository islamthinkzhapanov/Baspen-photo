"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminEvents, useAdminDeleteEvent } from "@/hooks/useAdmin";
import {
  RiSearchLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  Button,
  Card,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TextInput,
} from "@tremor/react";

const DEMO_EVENTS = {
  total: 24,
  events: [
    { id: "e1", title: "Almaty Marathon 2026", slug: "almaty-marathon-2026", ownerName: "Айбек Касымов", ownerEmail: "aibek@marathon.kz", photoCount: 4200, isPublished: true, pricingMode: "per_photo", createdAt: "2026-03-20T10:00:00Z" },
    { id: "e2", title: "Nauryz Festival", slug: "nauryz-festival", ownerName: "Дана Сериккызы", ownerEmail: "dana.s@gmail.com", photoCount: 3100, isPublished: true, pricingMode: "package", createdAt: "2026-03-15T08:00:00Z" },
    { id: "e3", title: "Tech Conference KZ", slug: "tech-conference-kz", ownerName: "Тимур Ахметов", ownerEmail: "timur.a@corp.kz", photoCount: 2800, isPublished: true, pricingMode: "free", createdAt: "2026-03-10T09:00:00Z" },
    { id: "e4", title: "Корпоратив Kaspi", slug: "kaspi-corp-2026", ownerName: "Тимур Ахметов", ownerEmail: "timur.a@corp.kz", photoCount: 1580, isPublished: true, pricingMode: "per_photo", createdAt: "2026-03-05T14:00:00Z" },
    { id: "e5", title: "Ironman Astana 70.3", slug: "ironman-astana", ownerName: "Айбек Касымов", ownerEmail: "aibek@marathon.kz", photoCount: 6800, isPublished: true, pricingMode: "per_photo", createdAt: "2026-02-28T07:00:00Z" },
    { id: "e6", title: "Свадьба — Нурлан & Аида", slug: "nurlan-aida-wedding", ownerName: "Асель Нурланова", ownerEmail: "assel.n@gmail.com", photoCount: 920, isPublished: false, pricingMode: "package", createdAt: "2026-04-01T11:00:00Z" },
    { id: "e7", title: "Выпускной НИШ 2026", slug: "nis-graduation-2026", ownerName: "Камила Бектурганова", ownerEmail: "kamila.b@mail.ru", photoCount: 0, isPublished: false, pricingMode: "per_photo", createdAt: "2026-04-03T16:00:00Z" },
    { id: "e8", title: "Run The Silk Road", slug: "run-silk-road", ownerName: "Арман Сагинтаев", ownerEmail: "arman.s@run.kz", photoCount: 5400, isPublished: true, pricingMode: "per_photo", createdAt: "2026-02-15T06:00:00Z" },
  ],
};

export function AdminEventsPage() {
  const t = useTranslations("admin");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data: apiData } = useAdminEvents({ page, search });
  const data = apiData ?? DEMO_EVENTS;
  const deleteEvent = useAdminDeleteEvent();

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  function handleDelete(eventId: string, title: string) {
    if (!confirm(t("delete_event_confirm", { name: title }))) return;
    deleteEvent.mutate(eventId, {
      onSuccess: () => toast.success(t("event_deleted")),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">{t("events_title")}</h1>

      <div className="flex items-center gap-3">
        <TextInput
          icon={RiSearchLine}
          placeholder={t("search_events")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("event")}</TableHeaderCell>
              <TableHeaderCell className="hidden sm:table-cell">{t("owner")}</TableHeaderCell>
              <TableHeaderCell className="hidden md:table-cell">{t("photos")}</TableHeaderCell>
              <TableHeaderCell>{t("status")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("actions_col")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.events?.map(
              (event: {
                id: string;
                title: string;
                slug: string;
                ownerName: string | null;
                ownerEmail: string;
                photoCount: number;
                isPublished: boolean;
                pricingMode: string;
                createdAt: string;
              }) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-text-secondary text-xs">/{event.slug}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-text-secondary">
                    {event.ownerName || event.ownerEmail}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {event.photoCount}
                  </TableCell>
                  <TableCell>
                    <Badge color={event.isPublished ? "green" : "gray"} size="xs">
                      {event.isPublished ? t("published") : t("draft")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/e/${event.slug}`}
                        className="text-text-secondary hover:text-primary"
                        target="_blank"
                      >
                        <RiExternalLinkLine size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        className="text-text-secondary hover:text-red-500"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}
            {data?.events?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-text-secondary">
                  {t("no_events")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {t("page_info", { page, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-active disabled:opacity-40 transition-colors"
            >
              <RiArrowLeftSLine size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-active disabled:opacity-40 transition-colors"
            >
              <RiArrowRightSLine size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
