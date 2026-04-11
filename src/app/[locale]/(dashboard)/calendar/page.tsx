"use client";

import { useTranslations } from "next-intl";
import { RiCalendarLine } from "@remixicon/react";
import { Card } from "@tremor/react";

export default function CalendarPage() {
  const t = useTranslations("nav");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("calendar")}</h1>
      </div>
      <Card className="p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <RiCalendarLine size={32} className="text-primary" />
          </div>
          <p className="text-sm text-text-secondary">Скоро здесь появится журнал записи клиентов</p>
        </div>
      </Card>
    </div>
  );
}
