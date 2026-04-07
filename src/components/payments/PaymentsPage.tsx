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
  RiLoader4Line,
} from "@remixicon/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

type PaymentsData = {
  transactions: Transaction[];
  stats: {
    totalEarned: number;
    pending: number;
    pendingCount: number;
  };
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
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery<PaymentsData>({
    queryKey: ["payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments");
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
  });

  const transactions = data?.transactions ?? [];
  const stats = data?.stats ?? { totalEarned: 0, pending: 0, pendingCount: 0 };

  const filtered = transactions.filter((tx) => {
    if (filter === "completed" && tx.status !== "completed") return false;
    if (filter === "pending" && tx.status !== "pending") return false;
    if (
      searchQuery &&
      !tx.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !tx.event.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RiLoader4Line size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-red-500">
          {t("error_loading")}
        </p>
      </div>
    );
  }

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
        <div className="relative max-w-xs">
          <RiSearchLine
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-bg placeholder:text-text-secondary focus:outline-none focus:border-border-active transition-colors"
          />
        </div>
        <Button
          className="sm:ml-auto"
          variant="secondary"
          icon={() => <RiDownloadLine size={16} />}
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
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((tx) => {
                const status = statusConfig[tx.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                          <RiArrowLeftDownLine size={16} />
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-text-secondary">
                            {formatDate(tx.date, "ru-RU")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary hidden sm:table-cell">
                      {tx.event}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <RiBankCardLine
                          size={14}
                          className="text-text-secondary"
                        />
                        <span className="text-text-secondary text-xs">
                          {tx.method}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold tabular-nums text-success">
                        +{tx.amount.toLocaleString("ru-RU")} ₸
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <Badge color={status.color} icon={StatusIcon} size="xs">
                        {status.label}
                      </Badge>
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
