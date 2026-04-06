"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { RiLogoutBoxRLine } from "@remixicon/react";

export default function PhotographerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen bg-bg">
      {/* Minimal header — no navigation, photographer is scoped to one event */}
      <header className="border-b border-border bg-bg-secondary px-6 py-4 flex items-center justify-between">
        <img
          src="/logo-baspen.svg"
          alt="Baspen"
          className="h-5 w-auto brightness-0"
        />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <RiLogoutBoxRLine size={16} />
          {t("logout")}
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
