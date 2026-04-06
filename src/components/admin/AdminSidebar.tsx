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
  RiSideBarLine,
} from "@remixicon/react";
import { useSidebar } from "@/components/layout/SidebarContext";

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
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border bg-bg-secondary h-screen sticky top-0 transition-all duration-200 ${
        collapsed ? "md:w-16" : "md:w-60"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "justify-center p-4" : "justify-between p-6"}`}>
        {!collapsed && (
          <Link href="/admin/users" className="flex items-center gap-2">
            <img src="/logo-baspen.svg" alt="Baspen" className="h-5 w-auto brightness-0" />
            <span className="text-sm font-medium text-text-secondary">Admin</span>
          </Link>
        )}
        <button
          onClick={toggle}
          className="text-text-secondary hover:text-text transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <RiSideBarLine size={20} />
        </button>
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
                  ? "text-primary"
                  : "text-text-secondary hover:bg-bg hover:text-text"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? t(`nav.${key}`) : undefined}
            >
              <Icon size={20} />
              {!collapsed && t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <Link
          href="/events"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg hover:text-text transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? t("back_to_dashboard") : undefined}
        >
          <RiArrowLeftLine size={20} />
          {!collapsed && t("back_to_dashboard")}
        </Link>
      </div>
    </aside>
  );
}
