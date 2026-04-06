"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (!res.ok) {
        throw new Error("Failed");
      }

      setSent(true);
    } catch {
      setError(t("reset_error"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text mb-2">{t("reset_email_sent")}</h2>
        <p className="text-text-secondary text-sm mb-6">{t("reset_email_sent_desc")}</p>
        <Link href="/login" className="text-[#005bd1] underline text-sm">
          {t("back_to_login")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[36px] font-bold leading-[44px] text-text uppercase tracking-tight">
        {t("reset_password")}
      </h2>

      <p className="mt-4 text-[14px] leading-[20px] tracking-[-0.5px] text-[#7b7b7b]">
        {t("reset_password_desc")}
      </p>

      {error && (
        <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            {t("email")}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="baspen@inbox.com"
            className="w-full px-4 py-2.5 rounded-tremor-default border border-tremor-border bg-tremor-background shadow-tremor-input text-tremor-default text-tremor-content-emphasis placeholder:text-tremor-content-subtle outline-none focus:ring-1 focus:ring-tremor-brand"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? t("reset_sending") : t("reset_send_link")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/login" className="text-[#005bd1] underline">
          {t("back_to_login")}
        </Link>
      </p>
    </div>
  );
}
