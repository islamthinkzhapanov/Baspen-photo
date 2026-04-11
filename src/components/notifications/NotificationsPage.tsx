"use client";

import { useTranslations } from "next-intl";
import { RiNotification3Line } from "@remixicon/react";
import { Card } from "@tremor/react";

export function NotificationsPage() {
  const t = useTranslations("notifications");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
      </div>

      <Card className="p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <RiNotification3Line size={32} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">{t("empty_title")}</h2>
          <p className="text-sm text-text-secondary mt-2">{t("empty_desc")}</p>
        </div>
      </Card>
    </div>
  );
}
