"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminUsers, useUpdateUserRole, useResendInvite } from "@/hooks/useAdmin";
import { RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine, RiMailSendLine } from "@remixicon/react";
import { toast } from "sonner";
import {
  Select,
  SelectItem,
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  TextInput,
} from "@tremor/react";
import { InviteModal } from "./InviteModal";

const ROLES = ["super_admin", "user"] as const;

const DEMO_USERS = {
  total: 48,
  users: [
    { id: "u1", name: "Ислам Жапанов", email: "islam@baspen.kz", role: "super_admin", status: "active", eventCount: 12, createdAt: "2025-11-10T10:00:00Z" },
    { id: "u2", name: "Айбек Касымов", email: "aibek@marathon.kz", role: "user", status: "active", eventCount: 8, createdAt: "2025-12-01T09:00:00Z" },
    { id: "u3", name: "Дана Сериккызы", email: "dana.s@gmail.com", role: "user", status: "invited", eventCount: 0, createdAt: "2026-01-15T11:00:00Z" },
    { id: "u4", name: "Максим Ли", email: "max.li@photo.kz", role: "user", status: "active", eventCount: 14, createdAt: "2026-01-20T08:30:00Z" },
    { id: "u5", name: "Асель Нурланова", email: "assel.n@gmail.com", role: "user", status: "active", eventCount: 7, createdAt: "2026-02-05T12:00:00Z" },
    { id: "u6", name: "Тимур Ахметов", email: "timur.a@corp.kz", role: "user", status: "invited", eventCount: 0, createdAt: "2026-02-18T14:00:00Z" },
    { id: "u7", name: "Камила Бектурганова", email: "kamila.b@mail.ru", role: "user", status: "active", eventCount: 9, createdAt: "2026-03-01T10:00:00Z" },
    { id: "u8", name: "Руслан Омаров", email: "ruslan.o@baspen.kz", role: "super_admin", status: "active", eventCount: 12, createdAt: "2025-11-10T10:00:00Z" },
    { id: "u9", name: "Мадина Жумабаева", email: "madina.zh@gmail.com", role: "user", status: "active", eventCount: 2, createdAt: "2026-03-10T16:00:00Z" },
    { id: "u10", name: "Арман Сагинтаев", email: "arman.s@run.kz", role: "user", status: "active", eventCount: 6, createdAt: "2026-03-15T09:00:00Z" },
  ],
};

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status?: string;
  eventCount: number;
  createdAt: string;
};

export function UsersPage() {
  const t = useTranslations("admin");
  const tr = useTranslations("roles");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: apiData } = useAdminUsers({ page, search, role: roleFilter });
  const data = apiData ?? DEMO_USERS;
  const updateRole = useUpdateUserRole();
  const resendInvite = useResendInvite();

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  function handleRoleChange(userId: string, role: string) {
    updateRole.mutate(
      { userId, role },
      {
        onSuccess: () => toast.success(t("role_updated")),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleResend(userId: string) {
    resendInvite.mutate(userId, {
      onSuccess: () => toast.success(t("invite_resent")),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{t("users_title")}</h1>
        <Button
          icon={() => <RiMailSendLine size={16} className="mr-2" />}
          onClick={() => setInviteOpen(true)}
        >
          {t("invite_user")}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <TextInput
          icon={RiSearchLine}
          placeholder={t("search_users")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <div className="flex bg-bg-secondary rounded-lg p-1 gap-0.5">
          <button
            onClick={() => { setRoleFilter(""); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              roleFilter === ""
                ? "bg-bg text-text font-medium"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {t("all_roles")}
          </button>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                roleFilter === r
                  ? "bg-bg text-text font-medium"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {tr(r)}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{t("user")}</TableHeaderCell>
              <TableHeaderCell className="hidden sm:table-cell">Email</TableHeaderCell>
              <TableHeaderCell>{t("role")}</TableHeaderCell>
              <TableHeaderCell>{t("status")}</TableHeaderCell>
              <TableHeaderCell className="hidden md:table-cell">{t("events_count")}</TableHeaderCell>
              <TableHeaderCell className="hidden lg:table-cell">{t("registered")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.users?.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name || "—"}</div>
                  <div className="text-text-secondary sm:hidden text-xs">
                    {user.email}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-text-secondary">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(val) => handleRoleChange(user.id, val)}
                    enableClear={false}
                  >
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {tr(r)}
                      </SelectItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  {user.status === "invited" ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                        {t("status_invited")}
                      </span>
                      <button
                        onClick={() => handleResend(user.id)}
                        disabled={resendInvite.isPending}
                        className="text-xs text-text-secondary hover:text-text underline transition-colors disabled:opacity-50"
                      >
                        {t("resend_invite")}
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                      {t("status_active")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {user.eventCount}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-text-secondary">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {data?.users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-text-secondary">
                  {t("no_users")}
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

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
