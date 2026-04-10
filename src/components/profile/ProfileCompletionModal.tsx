"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button, TextInput } from "@tremor/react";

export function ProfileCompletionModal() {
  const { data: session, update } = useSession();
  const t = useTranslations("profileCompletion");

  const [name, setName] = useState(session?.user?.name || "");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = name.trim() && phone.trim() && occupation.trim();

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
          phone: phone.trim(),
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
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+77758803866"
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
            className="w-full cursor-pointer"
          >
            {t("submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
