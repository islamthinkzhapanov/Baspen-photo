"use client";

import { useMemo, useRef, useState } from "react";
import { Search, ChevronDown, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/tremor/Popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/tremor/Select";
import type { ServiceWithCategory, BundleWithItems } from "@/hooks/useServices";
import type { ServiceCategory } from "@/db/schema/service-categories";

interface ServiceMultiSelectProps {
  services: ServiceWithCategory[];
  categories: ServiceCategory[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  isLoading?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  defaultServiceLabel?: string;
  bundles?: BundleWithItems[];
  onSelectBundle?: (bundle: BundleWithItems) => void;
  selectedBundleId?: string | null;
}

const COMBO_CATEGORY_ID = "__combo__";

export function ServiceMultiSelect({
  services,
  categories,
  selectedIds,
  onToggle,
  isLoading,
  hasError,
  disabled,
  defaultServiceLabel,
  bundles = [],
  onSelectBundle,
  selectedBundleId,
}: ServiceMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const isComboView = selectedCategoryId === COMBO_CATEGORY_ID;
  const activeBundles = useMemo(() => bundles.filter((b) => b.isActive), [bundles]);

  const filtered = useMemo(() => {
    if (isComboView) return [];
    let list = services;
    if (selectedCategoryId) {
      list = list.filter((s) => s.categoryId === selectedCategoryId);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [services, selectedCategoryId, search, isComboView]);

  const filteredBundles = useMemo(() => {
    if (!isComboView) return [];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return activeBundles.filter((b) => b.name.toLowerCase().includes(q));
    }
    return activeBundles;
  }, [activeBundles, search, isComboView]);

  const triggerLabel = useMemo(() => {
    const count = selectedIds.size;
    if (count === 0) return null;
    if (count === 1) {
      const svc = services.find((s) => selectedIds.has(s.id));
      return svc?.name ?? "1 услуга";
    }
    const last = count % 10;
    const lastTwo = count % 100;
    if (lastTwo >= 11 && lastTwo <= 19) return `${count} услуг выбрано`;
    if (last === 1) return `${count} услуга выбрана`;
    if (last >= 2 && last <= 4) return `${count} услуги выбрано`;
    return `${count} услуг выбрано`;
  }, [selectedIds, services]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSearch("");
    }
  }

  const categoryOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "", label: "Все категории" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ];
    if (activeBundles.length > 0) {
      opts.push({ value: COMBO_CATEGORY_ID, label: "Комбо услуги" });
    }
    return opts;
  }, [categories, activeBundles]);

  return (
    <div className="space-y-3">
      {/* Category select */}
      {categoryOptions.length > 1 && (
        <Select
          value={selectedCategoryId ?? "__all__"}
          onValueChange={(v) => setSelectedCategoryId(v === "__all__" ? null : v)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value || "__all__"} value={opt.value || "__all__"}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Combo bundles view */}
      {isComboView ? (
        <div className="space-y-1.5">
          {filteredBundles.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">Нет комбо услуг</div>
          ) : (
            filteredBundles.map((bundle) => {
              const isSelected = selectedBundleId === bundle.id;
              return (
                <button
                  key={bundle.id}
                  type="button"
                  onClick={() => onSelectBundle?.(bundle)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <Package className={cn("w-4 h-4 shrink-0", isSelected ? "text-blue-600" : "text-gray-400")} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", isSelected ? "text-blue-700" : "text-gray-800")}>
                      {bundle.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {bundle.items.map((i) => i.service?.name).filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-medium tabular-nums", isSelected ? "text-blue-700" : "text-gray-800")}>
                      {parseFloat(bundle.price).toLocaleString("ru-RU")} ₸
                    </p>
                    <p className="text-xs text-gray-400">{bundle.durationMin} мин</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        /* Service popover */
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-white outline-none transition-colors",
                hasError
                  ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={!defaultServiceLabel && triggerLabel ? "text-gray-900" : "text-gray-400"}>
                {defaultServiceLabel ?? triggerLabel ?? "Выбрать услугу"}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
            }}
          >
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск услуги..."
                  className="w-full rounded-md border border-gray-200 pl-8 pr-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Service list */}
            <div
              className="max-h-64 overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {isLoading ? (
                <div className="text-sm text-gray-400 px-3 py-4 text-center">
                  Загрузка...
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-sm text-gray-400 px-3 py-4 text-center">
                  Нет услуг
                </div>
              ) : (
                filtered.map((svc) => {
                  const checked = selectedIds.has(svc.id);
                  return (
                    <label
                      key={svc.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors",
                        checked && "bg-blue-50/50"
                      )}
                    >
                      <div className="relative shrink-0 w-4 h-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(svc.id)}
                          className="peer sr-only"
                        />
                        <div
                          className={cn(
                            "w-4 h-4 rounded border transition-colors flex items-center justify-center",
                            checked
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300 bg-white"
                          )}
                        >
                          {checked && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm text-gray-800">
                          <span className="truncate">{svc.name}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {svc.durationMin} мин
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums shrink-0 ml-2">
                        {parseFloat(svc.price as string).toLocaleString(
                          "ru-RU"
                        )}{" "}
                        ₸
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
