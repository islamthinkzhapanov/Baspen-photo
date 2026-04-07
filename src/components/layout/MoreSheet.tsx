"use client";

import { Link } from "@/i18n/navigation";
import type { RemixiconComponentType } from "@remixicon/react";
import { RiCloseLine } from "@remixicon/react";

interface MoreSheetItem {
  key: string;
  label: string;
  href: string;
  icon: RemixiconComponentType;
  active?: boolean;
}

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  items: MoreSheetItem[];
}

export function MoreSheet({ open, onClose, items }: MoreSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-bg rounded-t-2xl pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">Menu</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-secondary transition-colors"
          >
            <RiCloseLine size={20} className="text-text-secondary" />
          </button>
        </div>
        <nav className="py-2 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? "text-primary bg-primary/5"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
