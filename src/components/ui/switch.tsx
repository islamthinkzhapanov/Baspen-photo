"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex items-center shrink-0 cursor-pointer rounded-full border-none p-0.5 transition-colors duration-200 ease-in-out",
        checked ? "bg-primary" : "bg-gray-300",
        disabled && "opacity-40 cursor-not-allowed",
      )}
      style={{ width: 44, minWidth: 44, height: 24 }}
    >
      <span
        aria-hidden="true"
        className="block rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out"
        style={{
          width: 20,
          height: 20,
          transform: checked ? "translateX(20px)" : "translateX(0px)",
        }}
      />
    </button>
  );
}
