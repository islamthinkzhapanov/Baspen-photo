"use client";

import { useState, useRef, useEffect } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { RiTimeLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string; // "HH:mm" or ""
  onChange: (value: string) => void;
  placeholder?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export function TimePicker({ value, onChange, placeholder = "чч:мм" }: TimePickerProps) {
  const [selectedHour, setSelectedHour] = useState(() =>
    value ? value.split(":")[0] : ""
  );
  const [selectedMinute, setSelectedMinute] = useState(() =>
    value ? value.split(":")[1] : ""
  );
  const hourRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setSelectedHour(h);
      setSelectedMinute(m);
    }
  }, [value]);

  function handleSelect(hour: string, minute: string) {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    onChange(`${hour}:${minute}`);
  }

  const displayValue = value || "";

  return (
    <Popover className="relative">
      <PopoverButton
        className={cn(
          "relative flex w-full items-center rounded-tremor-default border border-tremor-border bg-tremor-background",
          "py-2 pl-10 pr-3 text-tremor-default shadow-tremor-input transition duration-100",
          "focus:ring-2 focus:border-tremor-brand-subtle focus:ring-tremor-brand-muted focus:outline-none",
          "cursor-pointer whitespace-nowrap"
        )}
      >
        <RiTimeLine className="absolute left-0 mx-2.5 h-5 w-5 shrink-0 text-tremor-content-subtle" />
        <span className={displayValue ? "text-tremor-content-emphasis" : "text-tremor-content"}>
          {displayValue || placeholder}
        </span>
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className="z-50 mt-1 w-32 rounded-tremor-default border border-tremor-border bg-tremor-background shadow-tremor-dropdown"
      >
        {({ close }) => (
          <div className="flex h-60">
            {/* Hours column */}
            <div
              ref={(el) => {
                hourRef.current = el;
                if (el && selectedHour) {
                  const idx = HOURS.indexOf(selectedHour);
                  if (idx >= 0) el.scrollTop = idx * 36 - 36;
                }
              }}
              className="flex-1 overflow-y-auto border-r border-tremor-border py-1 scrollbar-thin"
            >
              <div className="px-2 py-1 text-xs font-medium text-tremor-content sticky top-0 bg-tremor-background">
                Час
              </div>
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    const m = selectedMinute || "00";
                    handleSelect(h, m);
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-sm text-left transition-colors cursor-pointer",
                    selectedHour === h
                      ? "bg-tremor-brand-faint text-tremor-brand font-medium"
                      : "text-tremor-content-emphasis hover:bg-tremor-background-muted"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>

            {/* Minutes column */}
            <div className="flex-1 overflow-y-auto py-1">
              <div className="px-2 py-1 text-xs font-medium text-tremor-content sticky top-0 bg-tremor-background">
                Мин
              </div>
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    const h = selectedHour || "12";
                    handleSelect(h, m);
                    close();
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-sm text-left transition-colors cursor-pointer",
                    selectedMinute === m && selectedHour
                      ? "bg-tremor-brand-faint text-tremor-brand font-medium"
                      : "text-tremor-content-emphasis hover:bg-tremor-background-muted"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
