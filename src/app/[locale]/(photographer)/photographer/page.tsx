"use client";

import { useTranslations } from "next-intl";
import { RiMailLine } from "@remixicon/react";

export default function PhotographerPage() {
  const t = useTranslations("photographer");

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <RiMailLine size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold font-display mb-2">
          {t("no_direct_access_title")}
        </h2>
        <p className="text-sm text-text-secondary">
          {t("no_direct_access_desc")}
        </p>
      </div>
    </div>
  );
}
