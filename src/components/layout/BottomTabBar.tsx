"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  RiFolderOpenLine,
  RiBankCardLine,
  RiGraduationCapLine,
  RiMoreLine,
  RiStackLine,
  RiSettings3Line,
  RiShieldLine,
  RiUserLine,
  RiCalendarLine,
  RiGroupLine,
  RiBriefcaseLine,
  RiTeamLine,
  RiNotification3Line,
} from "@remixicon/react";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { MoreSheet } from "./MoreSheet";

const primaryTabs = [
  { key: "events", href: "/events", icon: RiFolderOpenLine },
  { key: "payments", href: "/payments", icon: RiBankCardLine },
  { key: "learning", href: "/learning", icon: RiGraduationCapLine },
] as const;

const overflowItems = [
  { key: "calendar", href: "/calendar", icon: RiCalendarLine },
  { key: "clients", href: "/clients", icon: RiGroupLine },
  { key: "services", href: "/services", icon: RiBriefcaseLine },
  { key: "staff", href: "/staff", icon: RiTeamLine },
  { key: "billing", href: "/billing", icon: RiStackLine },
  { key: "notifications", href: "/notifications", icon: RiNotification3Line },
  { key: "settings", href: "/settings", icon: RiSettings3Line },
  { key: "profile", href: "/profile", icon: RiUserLine },
] as const;

const adminItem = { key: "admin", href: "/admin/users", icon: RiShieldLine } as const;

export function BottomTabBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { isAdmin } = useUserRole();
  const [moreOpen, setMoreOpen] = useState(false);

  const isOverflowActive = overflowItems.some((item) =>
    pathname.startsWith(item.href)
  ) || (isAdmin && pathname.startsWith("/admin"));

  const moreItems = [
    ...overflowItems.map((item) => ({
      ...item,
      label: t(item.key),
      active: pathname.startsWith(item.href),
    })),
    ...(isAdmin
      ? [
          {
            ...adminItem,
            label: t("admin"),
            active: pathname.startsWith("/admin"),
          },
        ]
      : []),
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
              <span>{t(tab.key)}</span>
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
          <span>{t("more")}</span>
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
