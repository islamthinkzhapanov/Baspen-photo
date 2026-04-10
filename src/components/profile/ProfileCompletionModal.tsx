"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TextInput } from "@tremor/react";
import confetti from "canvas-confetti";

export function ProfileCompletionModal() {
  const { data: session, update } = useSession();
  const t = useTranslations("profileCompletion");

  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");

  function formatPhone(d: string) {
    let r = "+7";
    if (d.length > 0) r += ` (${d.slice(0, 3)}`;
    if (d.length >= 3) r += `) ${d.slice(3, 6)}`;
    if (d.length >= 6) r += `-${d.slice(6, 8)}`;
    if (d.length >= 8) r += `-${d.slice(8, 10)}`;
    return r;
  }

  const phone = formatPhone(phoneDigits);
  const isPhoneValid = phoneDigits.length === 10;
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

      // Fire confetti
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      // Update session with profileCompleted flag
      await update({ profileCompleted: true });
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
            <input
              type="tel"
              value={phone}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="+7 (775) 880-38-66"
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  e.preventDefault();
                  setPhoneDigits((prev) => prev.slice(0, -1));
                }
              }}
              onChange={(e) => {
                const newDigits = e.target.value.replace(/\D/g, "");
                const stripped = newDigits.startsWith("7") ? newDigits.slice(1) : newDigits.startsWith("8") ? newDigits.slice(1) : newDigits;
                setPhoneDigits(stripped.slice(0, 10));
              }}
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

          <button
            type="submit"
            disabled={!isValid || loading}
            className="mt-6 w-full py-3 px-4 inline-flex items-center justify-center gap-x-2 text-sm font-medium rounded-lg bg-[var(--color-tremor-brand)] border border-[var(--color-tremor-brand)] text-white hover:bg-[var(--color-tremor-brand-emphasis)] focus:outline-none focus:bg-[var(--color-tremor-brand-emphasis)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.7)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000 hover:before:bg-[position:-100%_0,0_0]"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
