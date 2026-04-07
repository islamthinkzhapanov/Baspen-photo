"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminAudit } from "@/hooks/useAdmin";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import {
  Card,
  Badge,
  Select,
  SelectItem,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";

const ACTIONS = [
  "create",
  "update",
  "delete",
  "login",
  "role_change",
  "plan_change",
  "payment",
] as const;

const ENTITY_TYPES = ["user", "event", "photo", "order", "subscription", "plan"] as const;

const ACTION_COLORS: Record<string, "green" | "gray" | "red" | "blue" | "violet" | "amber" | "emerald"> = {
  create: "emerald",
  update: "blue",
  delete: "red",
  login: "gray",
  role_change: "violet",
  plan_change: "amber",
  payment: "green",
};


type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  userName: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
};

function formatDetails(
  action: string,
  details: Record<string, unknown> | null,
  t: (key: string) => string,
): string {
  if (!details) return "—";

  switch (action) {
    case "create": {
      if (details.title) return String(details.title);
      if (details.plan) return `${details.plan} — ${Number(details.amount).toLocaleString()} KZT`;
      return Object.values(details).join(", ");
    }
    case "payment": {
      const amt = Number(details.amount).toLocaleString();
      const cur = details.currency || "KZT";
      const photos = details.photos ? ` (${details.photos} ${t("photos_short")})` : "";
      return `${amt} ${cur}${photos}`;
    }
    case "role_change":
      return `${details.from} → ${details.to}`;
    case "plan_change":
      if (details.from !== undefined && details.to !== undefined) {
        return `${details.field}: ${Number(details.from).toLocaleString()} → ${Number(details.to).toLocaleString()}`;
      }
      return String(details.field);
    case "update":
      return `${details.field} = ${String(details.value)}`;
    case "login":
      return details.provider ? String(details.provider) : "—";
    case "delete":
      return details.reason ? String(details.reason) : "—";
    default:
      return JSON.stringify(details).slice(0, 60);
  }
}

function UserInitials({ name }: { name: string | null }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div className="w-8 h-8 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-xs font-medium text-text-secondary shrink-0">
      {initials}
    </div>
  );
}

export function AuditPage() {
  const t = useTranslations("admin");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");

  const { data } = useAdminAudit({ page, action, entityType });
  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("audit_title")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("audit_subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-[250px]">
          <Select
            value={action}
            onValueChange={(val) => { setAction(val); setPage(1); }}
            placeholder={t("all_actions")}
            enableClear
          >
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {t(`action_${a}`)}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="w-[250px]">
          <Select
            value={entityType}
            onValueChange={(val) => { setEntityType(val); setPage(1); }}
            placeholder={t("all_entities")}
            enableClear
          >
            {ENTITY_TYPES.map((et) => (
              <SelectItem key={et} value={et}>
                {t(`entity_${et}`)}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("user")}</TableHeaderCell>
              <TableHeaderCell>{t("action_col")}</TableHeaderCell>
              <TableHeaderCell className="hidden md:table-cell">{t("entity")}</TableHeaderCell>
              <TableHeaderCell className="hidden lg:table-cell">{t("details")}</TableHeaderCell>
              <TableHeaderCell className="text-right">{t("time")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.entries?.map((entry: AuditEntry) => (
              <TableRow key={entry.id}>
                {/* User */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserInitials name={entry.userName} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {entry.userName || "—"}
                      </div>
                      <div className="text-xs text-text-secondary truncate">
                        {entry.userEmail || ""}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Action badge */}
                <TableCell>
                  <Badge
                    color={ACTION_COLORS[entry.action] || "gray"}
                    size="xs"
                  >
                    {t(`action_${entry.action}`)}
                  </Badge>
                </TableCell>

                {/* Entity */}
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm">
                    {t(`entity_${entry.entityType}`)}
                  </div>
                  {entry.entityId && (
                    <span className="text-xs text-text-secondary font-mono">
                      {entry.entityId.slice(0, 8)}
                    </span>
                  )}
                </TableCell>

                {/* Details */}
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-text-secondary max-w-xs truncate block">
                    {formatDetails(entry.action, entry.details, t)}
                  </span>
                </TableCell>

                {/* Time */}
                <TableCell className="text-right whitespace-nowrap">
                  <div className="text-sm text-text-secondary">
                    {new Date(entry.createdAt).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {new Date(entry.createdAt).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data?.entries?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-text-secondary py-12">
                  {t("no_audit_entries")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {t("page_info", { page, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-active disabled:opacity-40 transition-colors cursor-pointer"
            >
              <RiArrowLeftSLine size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-active disabled:opacity-40 transition-colors cursor-pointer"
            >
              <RiArrowRightSLine size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
