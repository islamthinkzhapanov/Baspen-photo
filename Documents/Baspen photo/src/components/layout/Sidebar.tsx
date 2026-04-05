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
} from "@remixicon/react";
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

  return (
    <aside className="hidden md:flex md:w-60 flex-col border-r border-border bg-bg-secondary min-h-screen">
      <div className="p-6">
        <Link href="/events">
          <img src="/logo-baspen.svg" alt="Baspen" className="h-5 w-auto" />
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
              {t(key)}
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
            }`}
          >
            <RiShieldLine size={20} />
            {t("admin")}
          </Link>
        )}
      </nav>
    </aside>
  );
}
