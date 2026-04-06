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

const DEMO_AUDIT = {
  total: 86,
  entries: [
    { id: "a1", action: "create", entityType: "event", entityId: "e7abc123", details: { title: "Выпускной НИШ 2026" }, userName: "Камила Бектурганова", userEmail: "kamila.b@mail.ru", ipAddress: "178.89.42.11", createdAt: "2026-04-05T16:12:00Z" },
    { id: "a2", action: "payment", entityType: "order", entityId: "ord45def", details: { amount: 4500, currency: "KZT", photos: 3 }, userName: "Нурлан Абдыкаримов", userEmail: "nurlan.a@gmail.com", ipAddress: "95.56.78.22", createdAt: "2026-04-05T15:48:00Z" },
    { id: "a3", action: "role_change", entityType: "user", entityId: "u6bcd890", details: { from: "photographer", to: "owner" }, userName: "Ислам Жапанов", userEmail: "islam@baspen.kz", ipAddress: "185.120.1.5", createdAt: "2026-04-05T14:30:00Z" },
    { id: "a4", action: "update", entityType: "event", entityId: "e1abc456", details: { field: "isPublished", value: true }, userName: "Айбек Касымов", userEmail: "aibek@marathon.kz", ipAddress: "178.89.55.10", createdAt: "2026-04-05T13:15:00Z" },
    { id: "a5", action: "login", entityType: "user", entityId: "u2def789", details: { provider: "google" }, userName: "Дана Сериккызы", userEmail: "dana.s@gmail.com", ipAddress: "91.220.12.88", createdAt: "2026-04-05T12:00:00Z" },
    { id: "a6", action: "delete", entityType: "photo", entityId: "ph9012ab", details: { reason: "duplicate" }, userName: "Максим Ли", userEmail: "max.li@photo.kz", ipAddress: "185.120.3.14", createdAt: "2026-04-05T11:22:00Z" },
    { id: "a7", action: "create", entityType: "subscription", entityId: "sub34cd5", details: { plan: "Pro", amount: 9900 }, userName: "Арман Сагинтаев", userEmail: "arman.s@run.kz", ipAddress: "178.89.61.33", createdAt: "2026-04-05T10:05:00Z" },
    { id: "a8", action: "plan_change", entityType: "plan", entityId: "p2efg678", details: { field: "priceMonthly", from: 7900, to: 9900 }, userName: "Ислам Жапанов", userEmail: "islam@baspen.kz", ipAddress: "185.120.1.5", createdAt: "2026-04-04T18:40:00Z" },
    { id: "a9", action: "payment", entityType: "order", entityId: "ord78hij", details: { amount: 12000, currency: "KZT", photos: 8 }, userName: "Алия Темирова", userEmail: "aliya.t@mail.ru", ipAddress: "95.56.90.44", createdAt: "2026-04-04T17:10:00Z" },
    { id: "a10", action: "create", entityType: "event", entityId: "e6klm012", details: { title: "Свадьба — Нурлан & Аида" }, userName: "Асель Нурланова", userEmail: "assel.n@gmail.com", ipAddress: "178.89.33.77", createdAt: "2026-04-04T15:50:00Z" },
  ],
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

  const { data: apiData } = useAdminAudit({ page, action, entityType });
  const data = apiData ?? DEMO_AUDIT;
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
