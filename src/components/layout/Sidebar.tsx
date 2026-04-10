"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  RiFolderOpenLine,
  RiBankCardLine,
  RiSettings3Line,
  RiGraduationCapLine,
  RiBarChartBoxLine,
  RiStackLine,
  RiShieldLine,
  RiSideBarLine,
  RiLogoutBoxRLine,
  RiUserLine,
  RiNotification3Line,
  RiArrowDownSLine,
} from "@remixicon/react";
import { useSidebar } from "./SidebarContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

const navItems: readonly { key: string; href: string; icon: typeof RiBarChartBoxLine }[] = [
  { key: "dashboard", href: "/dashboard", icon: RiBarChartBoxLine },
  { key: "events", href: "/events", icon: RiFolderOpenLine },
  { key: "payments", href: "/payments", icon: RiBankCardLine },
  { key: "billing", href: "/billing", icon: RiStackLine },
  { key: "learning", href: "/learning", icon: RiGraduationCapLine },
];

export function Sidebar() {
  const t = useTranslations("nav");
  const ta = useTranslations("auth");
  const pathname = usePathname();
  const { isAdmin } = useUserRole();
  const { collapsed, toggle } = useSidebar();
  const { data: session } = useSession();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || "";
  const userEmail = session?.user?.email || "";
  const initial = userName.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase() || "?";

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [popoverOpen]);

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border bg-bg-secondary h-screen sticky top-0 transition-all duration-200 ${
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
          const label = t(key);
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-text-secondary hover:bg-bg hover:text-text"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} />
              {!collapsed && label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin/users"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/admin")
                ? "text-primary"
                : "text-text-secondary hover:bg-bg hover:text-text"
            } ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? t("admin") : undefined}
          >
            <RiShieldLine size={20} />
            {!collapsed && t("admin")}
          </Link>
        )}
      </nav>

      {/* Settings link above profile */}
      <div className="px-3 mb-1">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith("/settings")
              ? "text-primary"
              : "text-text-secondary hover:bg-bg hover:text-text"
          } ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? t("settings") : undefined}
        >
          <RiSettings3Line size={20} />
          {!collapsed && t("settings")}
        </Link>
      </div>

      {/* User profile at bottom */}
      <div className="relative px-3 pb-4" ref={popoverRef}>
        {/* Popover */}
        {popoverOpen && (
          <div
            className={`absolute bottom-full mb-2 bg-bg border border-border rounded-xl shadow-lg z-50 overflow-hidden ${
              collapsed ? "left-2 w-52" : "left-3 right-3"
            }`}
          >
            <div className="p-3 border-b border-border">
              <p className="text-sm font-semibold truncate">{userName || userEmail}</p>
              {userName && (
                <p className="text-xs text-text-secondary truncate">{userEmail}</p>
              )}
            </div>
            <nav className="py-1">
              <Link
                href="/notifications"
                onClick={() => setPopoverOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary hover:text-text transition-colors"
              >
                <RiNotification3Line size={18} />
                {t("notifications")}
              </Link>
              <Link
                href="/profile"
                onClick={() => setPopoverOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary hover:text-text transition-colors"
              >
                <RiUserLine size={18} />
                {t("profile")}
              </Link>
            </nav>
            <div className="border-t border-border py-1">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full cursor-pointer"
              >
                <RiLogoutBoxRLine size={18} />
                {ta("logout")}
              </button>
            </div>
          </div>
        )}

        {/* Avatar button */}
        <button
          onClick={() => setPopoverOpen(!popoverOpen)}
          className={`flex items-center gap-3 w-full rounded-lg p-2 hover:bg-bg transition-colors cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? userName || userEmail : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{userName || userEmail}</p>
              </div>
              <RiArrowDownSLine size={18} className={`text-text-secondary shrink-0 transition-transform duration-200 ${popoverOpen ? "rotate-180" : ""}`} />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
