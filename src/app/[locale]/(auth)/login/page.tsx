"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { TextInput, Button, Callout, Divider } from "@tremor/react";
import { RiEyeLine, RiEyeOffLine, RiErrorWarningLine } from "@remixicon/react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("invalid_credentials"));
    } else {
      router.push("/events");
    }
  }

  return (
    <div>
      {/* Title */}
      <h2 className="text-[36px] font-bold leading-[44px] text-text uppercase tracking-tight">
        {t("login")}
      </h2>

      {/* Subtitle with register link */}
      <p className="mt-4 text-[14px] leading-[20px] tracking-[-0.5px] text-[#7b7b7b]">
        {t("no_account")}{" "}
        <Link href="/register" className="text-[#005bd1] underline">
          {t("register")}
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

        {/* Forgot password */}
        <p className="text-[14px] leading-[20px] tracking-[-0.5px] text-text">
          {t("forgot_password")}{" "}
          <Link href="/reset-password" className="text-[#005bd1] underline">
            {t("reset") || "Сбросить"}
          </Link>
        </p>

        {/* Submit button */}
        <Button type="submit" loading={loading} className="w-full cursor-pointer">
          {t("login")}
        </Button>
      </form>

      {/* Divider */}
      <Divider>{t("or") || "или"}</Divider>

      {/* Social buttons */}
      <div className="flex flex-col gap-3">
        {/* Google */}
        <Button
          variant="secondary"
          onClick={() => signIn("google", { callbackUrl: "/events" })}
          className="w-full cursor-pointer"
          icon={() => (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
        >
          {t("google_continue") || "Продолжить с помощью Google"}
        </Button>

      </div>
    </div>
  );
}
