"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminAudit } from "@/hooks/useAdmin";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import {
  Select,
  SelectItem,
  Button,
  Card,
  Badge,
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

export function AuditPage() {
  const t = useTranslations("admin");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");

  const { data, isLoading } = useAdminAudit({ page, action, entityType });
  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">{t("audit_title")}</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={action}
          onValueChange={(val) => {
            setAction(val);
            setPage(1);
          }}
          className="w-auto"
        >
          <SelectItem value="">{t("all_actions")}</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {t(`action_${a}`)}
            </SelectItem>
          ))}
        </Select>
        <Select
          value={entityType}
          onValueChange={(val) => {
            setEntityType(val);
            setPage(1);
          }}
          className="w-auto"
        >
          <SelectItem value="">{t("all_entities")}</SelectItem>
          {ENTITY_TYPES.map((et) => (
            <SelectItem key={et} value={et}>
              {t(`entity_${et}`)}
            </SelectItem>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 bg-bg-secondary rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("time")}</TableHeaderCell>
                <TableHeaderCell>{t("user")}</TableHeaderCell>
                <TableHeaderCell>{t("action_col")}</TableHeaderCell>
                <TableHeaderCell className="hidden md:table-cell">{t("entity")}</TableHeaderCell>
                <TableHeaderCell className="hidden lg:table-cell">{t("details")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.entries?.map(
                (entry: {
                  id: string;
                  action: string;
                  entityType: string;
                  entityId: string | null;
                  details: Record<string, unknown> | null;
                  userName: string | null;
                  userEmail: string | null;
                  ipAddress: string | null;
                  createdAt: string;
                }) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-text-secondary whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell>
                      {entry.userName || entry.userEmail || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={
                          entry.action === "delete"
                            ? "red"
                            : entry.action === "create"
                              ? "green"
                              : "gray"
                        }
                        size="xs"
                      >
                        {t(`action_${entry.action}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-text-secondary">
                      {t(`entity_${entry.entityType}`)}
                      {entry.entityId && (
                        <span className="ml-1 text-xs">#{entry.entityId.slice(0, 8)}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-text-secondary text-xs max-w-xs truncate">
                      {entry.details
                        ? JSON.stringify(entry.details).slice(0, 80)
                        : "—"}
                    </TableCell>
                  </TableRow>
                )
              )}
              {data?.entries?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-text-secondary">
                    {t("no_audit_entries")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {t("page_info", { page, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              icon={() => <RiArrowLeftSLine size={16} />}
            />
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              icon={() => <RiArrowRightSLine size={16} />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
