"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  RiGroupLine,
  RiFolderOpenLine,
  RiBankCardLine,
  RiStackLine,
  RiBarChart2Line,
  RiFileList2Line,
  RiArrowLeftLine,
} from "@remixicon/react";
const navItems: readonly { key: string; href: string; icon: typeof RiGroupLine }[] = [
  { key: "users", href: "/admin/users", icon: RiGroupLine },
  { key: "events", href: "/admin/events", icon: RiFolderOpenLine },
  { key: "finance", href: "/admin/finance", icon: RiBankCardLine },
  { key: "plans", href: "/admin/plans", icon: RiStackLine },
  { key: "metrics", href: "/admin/metrics", icon: RiBarChart2Line },
  { key: "audit", href: "/admin/audit", icon: RiFileList2Line },
];

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 flex-col border-r border-border bg-bg-secondary min-h-screen">
      <div className="p-6">
        <Link href="/admin/users" className="flex items-center gap-2">
          <img src="/logo-baspen.svg" alt="Baspen" className="h-5 w-auto" />
          <span className="text-sm font-medium text-text-secondary">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ key, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-bg hover:text-text"
              }`}
            >
              <Icon size={20} />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <Link
          href="/events"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg hover:text-text transition-colors"
        >
          <RiArrowLeftLine size={20} />
          {t("back_to_dashboard")}
        </Link>
      </div>
    </aside>
  );
}
