"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { TextInput, Button, Callout } from "@tremor/react";
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

    </div>
  );
}
