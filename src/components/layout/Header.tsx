"use client";

import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { RiLogoutBoxLine, RiMenuLine, RiCloseLine, RiGlobalLine } from "@remixicon/react";
import { useState } from "react";
import { routing } from "@/i18n/routing";

export function Header() {
  const t = useTranslations();
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  function switchLocale(locale: string) {
    router.replace(pathname, { locale });
    setLangOpen(false);
  }

  return (
    <header className="h-14 border-b border-border bg-bg flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
        </button>
        <Link href="/events" className="md:hidden text-lg font-bold text-primary">
          Baspen
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text"
          >
            <RiGlobalLine size={16} />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-8 bg-bg border border-border rounded-lg shadow-lg py-1 z-50">
              {routing.locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className="block w-full px-4 py-2 text-sm hover:bg-bg-secondary text-left"
                >
                  {loc === "ru" ? "Русский" : loc === "kz" ? "Қазақша" : "English"}
                </button>
              ))}
            </div>
          )}
        </div>

        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary hidden sm:block">
              {session.user.name || session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-text-secondary hover:text-text"
              title={t("auth.logout")}
            >
              <RiLogoutBoxLine size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
