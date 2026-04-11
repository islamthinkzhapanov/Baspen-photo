"use client";

import { useTranslations } from "next-intl";
import {
  RiBankCardLine,
  RiArrowLeftDownLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiSearchLine,
  RiDownloadLine,
  RiWalletLine,
  RiArrowUpLine,
  RiMoneyDollarCircleLine,
  RiCloseCircleLine,
  RiRefundLine,
  RiMore2Line,
  RiEyeLine,
  RiDeleteBinLine,
} from "@remixicon/react";
import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Card,
  Button,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";

type Transaction = {
  id: string;
  type: "income";
  description: string;
  event: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "refunded";
  date: string;
  method: string;
};

// --- Demo data ---
const demoTransactions: Transaction[] = [
  {
    id: "demo-1",
    type: "income",
    description: "Покупка 12 фото",
    event: "Марафон Алматы 2026",
    amount: 6000,
    currency: "KZT",
    status: "completed",
    date: "2026-04-10T14:32:00Z",
    method: "Kaspi Pay",
  },
  {
    id: "demo-2",
    type: "income",
    description: "Покупка 5 фото",
    event: "Свадьба Айгерим & Арман",
    amount: 2500,
    currency: "KZT",
    status: "completed",
    date: "2026-04-08T09:15:00Z",
    method: "Kaspi Pay",
  },
  {
    id: "demo-3",
    type: "income",
    description: "Пакет — все фото",
    event: "Корпоратив BTS Group",
    amount: 25000,
    currency: "KZT",
    status: "pending",
    date: "2026-04-07T18:45:00Z",
    method: "Stripe",
  },
  {
    id: "demo-4",
    type: "income",
    description: "Покупка 3 фото",
    event: "День рождения Данияр",
    amount: 1500,
    currency: "KZT",
    status: "completed",
    date: "2026-04-05T11:20:00Z",
    method: "Ручной",
  },
  {
    id: "demo-5",
    type: "income",
    description: "Покупка 8 фото",
    event: "Выпускной НИШ",
    amount: 4000,
    currency: "KZT",
    status: "refunded",
    date: "2026-04-03T16:00:00Z",
    method: "Kaspi Pay",
  },
  {
    id: "demo-6",
    type: "income",
    description: "Пакет — все фото",
    event: "Марафон Алматы 2026",
    amount: 15000,
    currency: "KZT",
    status: "completed",
    date: "2026-03-28T10:05:00Z",
    method: "Stripe",
  },
  {
    id: "demo-7",
    type: "income",
    description: "Покупка 2 фото",
    event: "Свадьба Айгерим & Арман",
    amount: 1000,
    currency: "KZT",
    status: "failed",
    date: "2026-03-25T20:30:00Z",
    method: "Kaspi Pay",
  },
];

const demoStats = {
  totalEarned: 50000,
  pending: 25000,
  pendingCount: 1,
};

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PaymentsPage() {
  const t = useTranslations("payments");
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpenId]);

  // Demo mode: use hardcoded data instead of API
  const transactions = demoTransactions;
  const stats = demoStats;

  const filtered = transactions.filter((tx) => {
    if (filter === "completed" && tx.status !== "completed") return false;
    if (filter === "pending" && tx.status !== "pending") return false;
    return true;
  });

  const statusConfig = {
    completed: {
      label: t("status_completed"),
      color: "green" as const,
      icon: RiCheckboxCircleLine,
    },
    pending: {
      label: t("status_pending"),
      color: "amber" as const,
      icon: RiTimeLine,
    },
    failed: {
      label: t("status_failed"),
      color: "red" as const,
      icon: RiCloseCircleLine,
    },
    refunded: {
      label: t("status_refunded"),
      color: "gray" as const,
      icon: RiRefundLine,
    },
  };

  const exportToExcel = useCallback(() => {
    const rows = filtered.map((tx) => ({
      [t("col_transaction")]: tx.description,
      [t("col_date")]: formatDate(tx.date, "ru-RU"),
      [t("col_project")]: tx.event,
      [t("col_method")]: tx.method,
      [t("col_amount")]: tx.amount,
      [t("col_status")]: statusConfig[tx.status].label,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("title"));
    XLSX.writeFile(wb, `payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [filtered, t, statusConfig]);

  const filterTabs = [
    { key: "all" as const, label: t("filter_all") },
    { key: "completed" as const, label: t("filter_income") },
    { key: "pending" as const, label: t("status_pending") },
  ];

  const statCards = [
    {
      label: t("total_earned"),
      value: `${stats.totalEarned.toLocaleString("ru-RU")} ₸`,
      icon: RiArrowUpLine,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: t("pending_balance"),
      value: `${stats.pending.toLocaleString("ru-RU")} ₸`,
      icon: RiTimeLine,
      color: "bg-amber-50 text-amber-600",
      extra:
        stats.pendingCount > 0 ? (
          <p className="text-xs text-amber-600 mt-1">
            {t("pending_count", { count: stats.pendingCount })}
          </p>
        ) : null,
    },
    {
      label: t("orders_total"),
      value: String(transactions.length),
      icon: RiMoneyDollarCircleLine,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <Icon size={20} />
                </div>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                {"extra" in stat && stat.extra}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex bg-bg-secondary rounded-lg p-1 gap-0.5 w-fit">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === tab.key
                  ? "bg-bg text-text font-medium shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button
          className="sm:ml-auto"
          variant="secondary"
          icon={() => <RiDownloadLine size={16} />}
          onClick={exportToExcel}
          disabled={filtered.length === 0}
        >
          {t("export")}
        </Button>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <Card className="p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <RiWalletLine size={32} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">
              {t("no_transactions_title")}
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              {t("no_transactions_desc")}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-12">№</TableHeaderCell>
                <TableHeaderCell>{t("col_transaction")}</TableHeaderCell>
                <TableHeaderCell className="hidden sm:table-cell">
                  {t("col_project")}
                </TableHeaderCell>
                <TableHeaderCell className="hidden md:table-cell">
                  {t("col_method")}
                </TableHeaderCell>
                <TableHeaderCell className="text-right">
                  {t("col_amount")}
                </TableHeaderCell>
                <TableHeaderCell className="text-right hidden sm:table-cell">
                  {t("col_status")}
                </TableHeaderCell>
                <TableHeaderCell className="w-10" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((tx, index) => {
                const status = statusConfig[tx.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="tabular-nums text-text-secondary">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                          <RiArrowLeftDownLine size={16} />
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-text-secondary">
                            {formatDate(tx.date, "ru-RU")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary text-sm hidden sm:table-cell">
                      {tx.event}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <RiBankCardLine
                          size={14}
                          className="text-text-secondary"
                        />
                        <span className="text-text-secondary text-sm">
                          {tx.method}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold tabular-nums text-sm text-success">
                        +{tx.amount.toLocaleString("ru-RU")} ₸
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <Badge color={status.color} icon={StatusIcon} size="xs">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="relative" ref={menuOpenId === tx.id ? menuRef : undefined}>
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === tx.id ? null : tx.id)}
                          className="p-1 rounded hover:bg-bg-secondary transition-colors cursor-pointer"
                        >
                          <RiMore2Line size={16} className="text-text-secondary" />
                        </button>
                        {menuOpenId === tx.id && (
                          <div className="absolute right-0 top-full mt-1 bg-bg border border-border rounded-lg shadow-lg z-20 min-w-[140px] py-1">
                            <button
                              onClick={() => setMenuOpenId(null)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg-secondary transition-colors w-full text-left cursor-pointer"
                            >
                              <RiEyeLine size={14} />
                              {t("view") || "Изменить"}
                            </button>
                            <button
                              onClick={() => setMenuOpenId(null)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                            >
                              <RiDeleteBinLine size={14} />
                              {t("delete") || "Удалить"}
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <RiSearchLine
                size={32}
                className="text-text-secondary mx-auto mb-2"
              />
              <p className="text-sm font-medium">{t("no_transactions")}</p>
              <p className="text-xs text-text-secondary mt-1">
                {t("no_transactions_desc")}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
