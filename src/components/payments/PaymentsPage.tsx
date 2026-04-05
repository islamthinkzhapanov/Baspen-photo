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
} from "@remixicon/react";
import { useState } from "react";
import {
  Card,
  TextInput,
  Button,
  Badge,
  TabGroup,
  TabList,
  Tab,
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

const statusConfig = {
  completed: { label: "Завершён", color: "green" as const, icon: RiCheckboxCircleLine },
  pending: { label: "Ожидает", color: "amber" as const, icon: RiTimeLine },
  processing: { label: "Обработка", color: "blue" as const, icon: RiTimeLine },
};

// --- Component ---

export function PaymentsPage() {
  const t = useTranslations();
  const [filterIndex, setFilterIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filterTypes = ["all", "income", "withdrawal"] as const;
  const filter = filterTypes[filterIndex];

  const filtered = transactions.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase()) && !tx.event.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1000px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("nav.payments")}</h1>
        <p className="text-sm text-text-secondary mt-1">История транзакций и вывод средств</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-white p-4">
          <p className="text-sm opacity-80">Доступно</p>
          <p className="text-2xl font-bold mt-1">{balanceStats.available.toLocaleString()} ₸</p>
          <button className="mt-3 text-xs bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition-colors">
            Вывести
          </button>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Ожидает зачисления</p>
          <p className="text-xl font-bold mt-1">{balanceStats.pending.toLocaleString()} ₸</p>
          <p className="text-xs text-amber-600 mt-2">2 транзакции</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Всего заработано</p>
          <p className="text-xl font-bold mt-1">{balanceStats.totalEarned.toLocaleString()} ₸</p>
          <p className="text-xs text-success mt-2">+18% за месяц</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-secondary">Выведено</p>
          <p className="text-xl font-bold mt-1">{balanceStats.withdrawn.toLocaleString()} ₸</p>
          <p className="text-xs text-text-secondary mt-2">2 вывода</p>
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <TabGroup index={filterIndex} onIndexChange={setFilterIndex} className="w-auto">
          <TabList variant="solid">
            <Tab>Все</Tab>
            <Tab>Поступления</Tab>
            <Tab>Выводы</Tab>
          </TabList>
        </TabGroup>
        <TextInput
          icon={() => <RiSearchLine size={16} />}
          placeholder="Поиск по описанию или проекту..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button variant="secondary" icon={() => <RiDownloadLine size={16} />}>
          Экспорт
        </Button>
      </div>

      {/* Transactions List */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Транзакция</TableHeaderCell>
              <TableHeaderCell className="hidden sm:table-cell">Проект</TableHeaderCell>
              <TableHeaderCell className="hidden md:table-cell">Метод</TableHeaderCell>
              <TableHeaderCell className="text-right">Сумма</TableHeaderCell>
              <TableHeaderCell className="text-right hidden sm:table-cell">Статус</TableHeaderCell>
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
                            ? "bg-success/10 text-success"
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
                      {tx.type === "income" ? "+" : "−"}{tx.amount.toLocaleString()} ₸
                    </span>
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    <Badge color={status.color} size="xs">
                      <span className="inline-flex items-center gap-1">
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-text-secondary text-sm">
            Транзакции не найдены
          </div>
        )}
      </Card>
    </div>
  );
}
