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


export function AdminEventsPage() {
  const t = useTranslations("admin");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data } = useAdminEvents({ page, search });
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
