"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  RiGroupLine,
  RiFolderOpenLine,
  RiBankCardLine,
  RiBarChart2Line,
  RiMoreLine,
  RiStackLine,
  RiFileList2Line,
  RiArrowLeftLine,
} from "@remixicon/react";
import { useState } from "react";
import { MoreSheet } from "@/components/layout/MoreSheet";

const primaryTabs = [
  { key: "users", href: "/admin/users", icon: RiGroupLine },
  { key: "events", href: "/admin/events", icon: RiFolderOpenLine },
  { key: "finance", href: "/admin/finance", icon: RiBankCardLine },
  { key: "metrics", href: "/admin/metrics", icon: RiBarChart2Line },
] as const;

const overflowItems = [
  { key: "plans", href: "/admin/plans", icon: RiStackLine },
  { key: "audit", href: "/admin/audit", icon: RiFileList2Line },
] as const;

export function AdminBottomTabBar() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isOverflowActive = overflowItems.some((item) =>
    pathname.startsWith(item.href)
  );

  const moreItems = [
    ...overflowItems.map((item) => ({
      ...item,
      label: t(`nav.${item.key}`),
      active: pathname.startsWith(item.href),
    })),
    {
      key: "back",
      href: "/events",
      icon: RiArrowLeftLine,
      label: t("back_to_dashboard"),
      active: false,
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-border bg-bg pb-[env(safe-area-inset-bottom)]">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                active ? "text-primary" : "text-text-secondary"
              }`}
            >
              <Icon size={22} />
              <span>{t(`nav.${tab.key}`)}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
            isOverflowActive ? "text-primary" : "text-text-secondary"
          }`}
        >
          <RiMoreLine size={22} />
          <span>{t("nav.more")}</span>
        </button>
      </nav>
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        items={moreItems}
      />
    </>
  );
}
