"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { TextInput, Button, Callout } from "@tremor/react";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiErrorWarningLine,
} from "@remixicon/react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("confirm_password") || "Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: email.split("@")[0] }),
      });

      if (res.status === 409) {
        setError(t("email_exists"));
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(t("register_error") || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError(t("register_error") || "Registration failed");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <Callout title={t("register_success")} icon={RiCheckLine} color="green" />
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <h2 className="text-[36px] font-bold leading-[44px] text-text uppercase tracking-tight">
        {t("register_title")}
      </h2>

      {/* Subtitle with login link */}
      <p className="mt-3 text-[14px] leading-[20px] tracking-[-0.5px] text-[#7b7b7b]">
        {t("has_account")}{" "}
        <Link href="/login" className="text-[#005bd1] underline">
          {t("login")}
        </Link>
      </p>

      {error && (
        <div className="mt-6">
          <Callout title={error} icon={RiErrorWarningLine} color="red" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            {t("email")}
          </label>
          <TextInput
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="baspen@inbox.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            {t("password")}
          </label>
          <div className="relative flex items-center rounded-tremor-default border border-tremor-border bg-tremor-background shadow-tremor-input focus-within:ring-1 focus-within:ring-tremor-brand">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password_placeholder") || "Введите пароль"}
              className="w-full bg-transparent py-2 pl-3 pr-10 text-tremor-default text-tremor-content-emphasis placeholder:text-tremor-content-subtle outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 p-1 text-tremor-content-subtle hover:text-tremor-content-emphasis transition-colors cursor-pointer"
            >
              {showPassword ? <RiEyeLine size={16} /> : <RiEyeOffLine size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            {t("confirm_password_label") || "Подтвердить пароль"}
          </label>
          <div className="relative flex items-center rounded-tremor-default border border-tremor-border bg-tremor-background shadow-tremor-input focus-within:ring-1 focus-within:ring-tremor-brand">
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("password_placeholder") || "Введите пароль"}
              className="w-full bg-transparent py-2 pl-3 pr-10 text-tremor-default text-tremor-content-emphasis placeholder:text-tremor-content-subtle outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2 p-1 text-tremor-content-subtle hover:text-tremor-content-emphasis transition-colors cursor-pointer"
            >
              {showConfirm ? <RiEyeLine size={16} /> : <RiEyeOffLine size={16} />}
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 pt-3">
          <Button type="submit" loading={loading} className="w-full cursor-pointer">
            {t("register_submit")}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="w-full cursor-pointer"
          >
            {t("back") || "Назад"}
          </Button>
        </div>
      </form>
    </div>
  );
}
