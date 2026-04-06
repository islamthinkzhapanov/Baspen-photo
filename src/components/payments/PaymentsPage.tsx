"use client";

import { useTranslations } from "next-intl";
import {
  RiBankCardLine,
  RiArrowRightUpLine,
  RiArrowLeftDownLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiSearchLine,
  RiDownloadLine,
  RiWalletLine,
  RiArrowUpLine,
  RiMoneyDollarCircleLine,
} from "@remixicon/react";
import { useState } from "react";
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

// --- Demo data ---

type Transaction = {
  id: string;
  type: "income" | "withdrawal";
  description: string;
  event: string;
  amount: number;
  status: "completed" | "pending" | "processing";
  date: string;
  method: string;
};

const transactions: Transaction[] = [
  {
    id: "TXN-001",
    type: "income",
    description: "Покупка 12 фото",
    event: "Almaty Marathon 2026",
    amount: 14400,
    status: "completed",
    date: "5 апр 2026, 14:32",
    method: "Kaspi Pay",
  },
  {
    id: "TXN-002",
    type: "income",
    description: "Пакет «Все мои фото»",
    event: "Almaty Marathon 2026",
    amount: 8500,
    status: "completed",
    date: "5 апр 2026, 12:15",
    method: "Kaspi Pay",
  },
  {
    id: "TXN-003",
    type: "withdrawal",
    description: "Вывод на карту",
    event: "—",
    amount: 120000,
    status: "processing",
    date: "4 апр 2026, 18:00",
    method: "Kaspi Gold •4821",
  },
  {
    id: "TXN-004",
    type: "income",
    description: "Покупка 3 фото",
    event: "Nauryz Festival",
    amount: 3600,
    status: "completed",
    date: "4 апр 2026, 11:45",
    method: "Карта •7712",
  },
  {
    id: "TXN-005",
    type: "income",
    description: "Пакет «Все мои фото»",
    event: "Tech Conference KZ",
    amount: 5200,
    status: "completed",
    date: "3 апр 2026, 16:20",
    method: "Kaspi Pay",
  },
  {
    id: "TXN-006",
    type: "income",
    description: "Покупка 8 фото",
    event: "Almaty Marathon 2026",
    amount: 9600,
    status: "completed",
    date: "3 апр 2026, 09:10",
    method: "Kaspi Pay",
  },
  {
    id: "TXN-007",
    type: "withdrawal",
    description: "Вывод на карту",
    event: "—",
    amount: 85000,
    status: "completed",
    date: "1 апр 2026, 10:00",
    method: "Kaspi Gold •4821",
  },
  {
    id: "TXN-008",
    type: "income",
    description: "Покупка 5 фото",
    event: "Nauryz Festival",
    amount: 6000,
    status: "pending",
    date: "1 апр 2026, 08:55",
    method: "Карта •3390",
  },
];

const balanceStats = {
  available: 248300,
  pending: 14500,
  totalEarned: 428500,
  withdrawn: 205000,
};

// --- Component ---

export function PaymentsPage() {
  const t = useTranslations("payments");
  const [filter, setFilter] = useState<"all" | "income" | "withdrawal">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = transactions.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (
      searchQuery &&
      !tx.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !tx.event.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const statusConfig = {
    completed: { label: t("status_completed"), color: "green" as const, icon: RiCheckboxCircleLine },
    pending: { label: t("status_pending"), color: "amber" as const, icon: RiTimeLine },
    processing: { label: t("status_processing"), color: "blue" as const, icon: RiTimeLine },
  };

  const filterTabs = [
    { key: "all" as const, label: t("filter_all") },
    { key: "income" as const, label: t("filter_income") },
    { key: "withdrawal" as const, label: t("filter_withdrawal") },
  ];

  const statCards = [
    {
      label: t("available"),
      value: `${balanceStats.available.toLocaleString("ru-RU")} ₸`,
      icon: RiWalletLine,
      color: "bg-primary/10 text-primary",
      extra: (
        <button className="mt-2 text-xs text-primary font-medium hover:underline">
          {t("withdraw")}
        </button>
      ),
    },
    {
      label: t("pending_balance"),
      value: `${balanceStats.pending.toLocaleString("ru-RU")} ₸`,
      icon: RiTimeLine,
      color: "bg-amber-50 text-amber-600",
      extra: (
        <p className="text-xs text-amber-600 mt-1">{t("pending_count", { count: 2 })}</p>
      ),
    },
    {
      label: t("total_earned"),
      value: `${balanceStats.totalEarned.toLocaleString("ru-RU")} ₸`,
      icon: RiArrowUpLine,
      color: "bg-emerald-50 text-emerald-600",
      extra: (
        <p className="text-xs text-success mt-1">{t("monthly_growth", { percent: 18 })}</p>
      ),
    },
    {
      label: t("withdrawn"),
      value: `${balanceStats.withdrawn.toLocaleString("ru-RU")} ₸`,
      icon: RiMoneyDollarCircleLine,
      color: "bg-violet-50 text-violet-600",
      extra: (
        <p className="text-xs text-text-secondary mt-1">{t("withdrawals_count", { count: 2 })}</p>
      ),
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.extra}
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
          <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-bg placeholder:text-text-secondary focus:outline-none focus:border-border-active transition-colors"
          />
        </div>
        <Button className="sm:ml-auto" variant="secondary" icon={() => <RiDownloadLine size={16} />}>
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
            <h2 className="text-lg font-semibold">{t("no_transactions_title")}</h2>
            <p className="text-sm text-text-secondary mt-2">{t("no_transactions_desc")}</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("col_transaction")}</TableHeaderCell>
                <TableHeaderCell className="hidden sm:table-cell">{t("col_project")}</TableHeaderCell>
                <TableHeaderCell className="hidden md:table-cell">{t("col_method")}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t("col_amount")}</TableHeaderCell>
                <TableHeaderCell className="text-right hidden sm:table-cell">{t("col_status")}</TableHeaderCell>
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
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            tx.type === "income"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <RiArrowLeftDownLine size={16} />
                          ) : (
                            <RiArrowRightUpLine size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-text-secondary">{tx.date}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary hidden sm:table-cell">{tx.event}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <RiBankCardLine size={14} className="text-text-secondary" />
                        <span className="text-text-secondary text-xs">{tx.method}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold tabular-nums ${tx.type === "income" ? "text-success" : "text-text"}`}>
                        {tx.type === "income" ? "+" : "−"}{tx.amount.toLocaleString("ru-RU")} ₸
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
              <RiSearchLine size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-sm font-medium">{t("no_transactions")}</p>
              <p className="text-xs text-text-secondary mt-1">{t("no_transactions_desc")}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
