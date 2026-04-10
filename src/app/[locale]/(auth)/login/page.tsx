"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState, useId } from "react";
import { useRouter } from "@/i18n/navigation";
import { Callout } from "@tremor/react";
import { RiEyeLine, RiEyeOffLine, RiErrorWarningLine } from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const id = useId();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);

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
      setOpen(false);
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

      {/* Login button opens modal */}
      <div className="mt-10">
        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            onClick={() => setOpen(true)}
            className="w-full cursor-pointer bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            size="lg"
          >
            {t("login")}
          </Button>

          <DialogContent>
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
                aria-hidden="true"
              >
                <svg
                  className="stroke-zinc-800 dark:stroke-zinc-100"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                >
                  <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
                </svg>
              </div>
              <DialogHeader>
                <DialogTitle className="sm:text-center">{t("login")}</DialogTitle>
                <DialogDescription className="sm:text-center">
                  {t("no_account")}{" "}
                  <Link href="/register" className="text-[#005bd1] underline">
                    {t("register")}
                  </Link>
                </DialogDescription>
              </DialogHeader>
            </div>

            {error && (
              <Callout title={error} icon={RiErrorWarningLine} color="red" />
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor={`${id}-email`}>{t("email")}</Label>
                  <Input
                    id={`${id}-email`}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="baspen@inbox.com"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor={`${id}-password`}>{t("password")}</Label>
                  <div className="relative">
                    <Input
                      id={`${id}-password`}
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("password_placeholder") || "Введите пароль"}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showPassword ? <RiEyeLine size={16} /> : <RiEyeOffLine size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  href="/reset-password"
                  className="text-sm text-[#005bd1] underline hover:no-underline"
                >
                  {t("forgot_password")} {t("reset") || "Сбросить"}
                </Link>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  t("login")
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
