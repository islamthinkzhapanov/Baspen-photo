"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/useAdmin";
import { RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { toast } from "sonner";
import {
  TextInput,
  Select,
  SelectItem,
  Button,
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";

const ROLES = ["super_admin", "owner", "photographer"] as const;

export function UsersPage() {
  const t = useTranslations("admin");
  const tr = useTranslations("roles");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data, isLoading } = useAdminUsers({ page, search, role: roleFilter });
  const updateRole = useUpdateUserRole();

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">{t("users_title")}</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <TextInput
          icon={() => <RiSearchLine size={16} />}
          placeholder={t("search_users")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1"
        />
        <Select
          value={roleFilter}
          onValueChange={(val) => {
            setRoleFilter(val);
            setPage(1);
          }}
          className="w-auto"
        >
          <SelectItem value="">{t("all_roles")}</SelectItem>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {tr(r)}
            </SelectItem>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("user")}</TableHeaderCell>
                <TableHeaderCell className="hidden sm:table-cell">Email</TableHeaderCell>
                <TableHeaderCell>{t("role")}</TableHeaderCell>
                <TableHeaderCell className="hidden md:table-cell">{t("events_count")}</TableHeaderCell>
                <TableHeaderCell className="hidden lg:table-cell">{t("registered")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.users?.map(
                (user: {
                  id: string;
                  name: string | null;
                  email: string;
                  role: string;
                  eventCount: number;
                  createdAt: string;
                }) => (
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
                    <TableCell className="hidden md:table-cell">
                      {user.eventCount}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-text-secondary">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                )
              )}
              {data?.users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-text-secondary">
                    {t("no_users")}
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
