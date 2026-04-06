"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { RiArrowLeftLine } from "@remixicon/react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("auth");

  return (
    <div className="flex min-h-screen">
      {/* Left: photo with overlay + logo */}
      <div className="hidden lg:block lg:w-[51.4%] relative">
        <Image
          src="/auth-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/logo-baspen.svg"
            alt="Baspen"
            width={200}
            height={42}
            className="brightness-0 invert"
          />
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 flex-col bg-white border-l border-border">
        {/* Back to home link */}
        <div className="px-6 pt-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#7b7b7b] hover:text-text transition-colors"
          >
            <RiArrowLeftLine size={16} />
            {t("back_to_home")}
          </Link>
        </div>

        {/* Form content */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[500px] px-6 py-12 lg:px-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
