"use client";

import { useTranslations } from "next-intl";
import { RiBriefcaseLine } from "@remixicon/react";
import { Card } from "@tremor/react";

export default function ServicesPage() {
  const t = useTranslations("nav");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("services")}</h1>
      </div>
      <Card className="p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <RiBriefcaseLine size={32} className="text-primary" />
          </div>
          <p className="text-sm text-text-secondary">Скоро здесь появится список услуг</p>
        </div>
      </Card>
    </div>
  );
}
