"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  RiFolderOpenLine,
  RiBankCardLine,
  RiSettings3Line,
  RiGraduationCapLine,
  RiDashboardLine,
  RiStackLine,
  RiShieldLine,
  RiSideBarLine,
} from "@remixicon/react";
import { useSidebar } from "./SidebarContext";

const navItems: readonly { key: string; href: string; icon: typeof RiDashboardLine }[] = [
  { key: "dashboard", href: "/dashboard", icon: RiDashboardLine },
  { key: "events", href: "/events", icon: RiFolderOpenLine },
  { key: "payments", href: "/payments", icon: RiBankCardLine },
  { key: "billing", href: "/billing", icon: RiStackLine },
  { key: "learning", href: "/learning", icon: RiGraduationCapLine },
  { key: "settings", href: "/settings", icon: RiSettings3Line },
];

export function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "super_admin";
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border bg-bg-secondary min-h-screen transition-all duration-200 ${
        collapsed ? "md:w-16" : "md:w-60"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "justify-center p-4" : "justify-between p-6"}`}>
        {!collapsed && (
          <Link href="/events">
            <img
              src="/logo-baspen.svg"
              alt="Baspen"
              className="h-5 w-auto brightness-0"
            />
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
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-bg hover:text-text"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? t(key) : undefined}
            >
              <Icon size={20} />
              {!collapsed && t(key)}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin/users"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/admin")
                ? "bg-primary/10 text-primary"
                : "text-text-secondary hover:bg-bg hover:text-text"
            } ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? t("admin") : undefined}
          >
            <RiShieldLine size={20} />
            {!collapsed && t("admin")}
          </Link>
        )}
      </nav>
    </aside>
  );
}
