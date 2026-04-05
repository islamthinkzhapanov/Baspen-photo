"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useCallback } from "react";
import { RiCloseLine, RiSearchLine, RiLoader4Line } from "@remixicon/react";
import { Button } from "@tremor/react";

interface Props {
  onSearch: (number: string) => void;
  onClose: () => void;
  isSearching?: boolean;
}

/**
 * 4-section number input matching Figma design: __ - __ - __ - __
 * Each section is a single digit, auto-focuses to next on input.
 */
export function NumberSearch({ onSearch, onClose, isSearching }: Props) {
  const t = useTranslations("public");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      const digit = value.replace(/\D/g, "").slice(-1);
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);

      // Auto-focus next input
      if (digit && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "Enter") {
        const number = digits.join("");
        if (number.length >= 1) {
          onSearch(number);
        }
      }
    },
    [digits, onSearch]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
      const newDigits = [...digits];
      for (let i = 0; i < Math.min(4, pasted.length); i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      // Focus last filled or next empty
      const focusIdx = Math.min(pasted.length, 3);
      inputRefs.current[focusIdx]?.focus();
    },
    [digits]
  );

  const fullNumber = digits.join("");

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-bg rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{t("enter_number")}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary rounded-full"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Number inputs */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {digits.map((digit, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-14 h-16 text-center text-2xl font-bold border-2 border-border
                  rounded-lg focus:border-primary focus:outline-none
                  transition-colors bg-bg"
                autoFocus={i === 0}
              />
              {i < 3 && (
                <span className="text-text-secondary text-xl font-light">
                  –
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Search button */}
        <Button
          onClick={() => onSearch(fullNumber)}
          disabled={fullNumber.length < 1 || isSearching}
          className="w-full"
        >
          <span className="flex items-center justify-center gap-2">
            {isSearching ? (
              <span className="animate-spin inline-flex"><RiLoader4Line size={20} /></span>
            ) : (
              <RiSearchLine size={20} />
            )}
            {t("search_by_number")}
          </span>
        </Button>
      </div>
    </div>
  );
}
