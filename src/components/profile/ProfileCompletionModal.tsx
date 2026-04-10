"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button, TextInput } from "@tremor/react";

export function ProfileCompletionModal() {
  const { data: session, update } = useSession();
  const t = useTranslations("profileCompletion");

  const [name, setName] = useState(session?.user?.name || "");
  const [phoneDigits, setPhoneDigits] = useState(""); // digits after +7, max 10
  const prevLenRef = useRef(0);

  function formatFromDigits(d: string) {
    let result = "+7";
    if (d.length > 0) result += ` (${d.slice(0, 3)}`;
    if (d.length >= 3) result += `) ${d.slice(3, 6)}`;
    if (d.length >= 6) result += `-${d.slice(6, 8)}`;
    if (d.length >= 8) result += `-${d.slice(8, 10)}`;
    return result;
  }

  const phone = formatFromDigits(phoneDigits);
  const isPhoneValid = phoneDigits.length === 10;

  function handlePhoneChange(value: string) {
    // Extract all digits, strip leading 7/8
    let raw = value.replace(/\D/g, "");
    if (raw.startsWith("7")) raw = raw.slice(1);
    else if (raw.startsWith("8")) raw = raw.slice(1);
    const clamped = raw.slice(0, 10);

    // If formatted length shrunk but digits didn't change, user deleted a format char — remove a digit
    const newFormatted = formatFromDigits(clamped);
    if (newFormatted.length < prevLenRef.current && clamped.length === phoneDigits.length && clamped.length > 0) {
      const trimmed = clamped.slice(0, -1);
      setPhoneDigits(trimmed);
      prevLenRef.current = formatFromDigits(trimmed).length;
      return;
    }

    setPhoneDigits(clamped);
    prevLenRef.current = newFormatted.length;
  }
  const [occupation, setOccupation] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = name.trim() && isPhoneValid && occupation.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: `+7${phoneDigits}`,
          occupation: occupation.trim(),
        }),
      });

      if (!res.ok) throw new Error();

      // Re-fetch session so profileCompleted updates
      await update();
    } catch {
      toast.error(t("save_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-bg border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-2xl font-bold font-display">{t("title")}</h2>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {t("subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("name_label")}
            </label>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name_placeholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("phone_label")}
            </label>
            <TextInput
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+7 (775) 880-38-66"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("occupation_label")}
            </label>
            <TextInput
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder={t("occupation_placeholder")}
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={!isValid}
            className="mt-6 w-full cursor-pointer"
          >
            {t("submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
