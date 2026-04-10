"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useEffect, useRef } from "react";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiCloseLine,
  RiMailLine,
  RiLockLine,
  RiErrorWarningFill,
  RiCheckboxCircleFill,
  RiLoader4Line,
} from "@remixicon/react";

type Tab = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

/* ── Icon type matching @remixicon/react ────────────────────────────── */
type IconComponent = React.ComponentType<{ size?: number | string; className?: string }>;

/* ── Reusable styled input ─────────────────────────────────────────── */
function AuthInput({
  icon: Icon,
  type = "text",
  ...props
}: {
  icon: IconComponent;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <div className="group relative flex items-center rounded-xl border border-border bg-white transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
      <Icon
        size={18}
        className="pointer-events-none absolute left-3.5 text-text-secondary transition-colors duration-200 group-focus-within:text-primary"
      />
      <input
        type={type}
        {...props}
        className="w-full rounded-xl bg-transparent py-3 pl-10 pr-4 text-[15px] text-text placeholder:text-text-secondary/60 outline-none"
      />
    </div>
  );
}

function PasswordInput({
  show,
  onToggle,
  ...props
}: {
  show: boolean;
  onToggle: () => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <div className="group relative flex items-center rounded-xl border border-border bg-white transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
      <RiLockLine
        size={18}
        className="pointer-events-none absolute left-3.5 text-text-secondary transition-colors duration-200 group-focus-within:text-primary"
      />
      <input
        type={show ? "text" : "password"}
        {...props}
        className="w-full rounded-xl bg-transparent py-3 pl-10 pr-11 text-[15px] text-text placeholder:text-text-secondary/60 outline-none"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 p-0.5 text-text-secondary hover:text-text transition-colors cursor-pointer"
        tabIndex={-1}
      >
        {show ? <RiEyeLine size={18} /> : <RiEyeOffLine size={18} />}
      </button>
    </div>
  );
}

/* ── Main modal ────────────────────────────────────────────────────── */
export default function AuthModal({
  open,
  onClose,
  initialTab = "login",
}: AuthModalProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  function switchTab(newTab: Tab) {
    setTab(newTab);
    setLoginError("");
    setRegError("");
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });

    setLoginLoading(false);

    if (result?.error) {
      setLoginError(t("invalid_credentials"));
    } else {
      onClose();
      router.push("/events");
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegError("");

    if (regPassword !== regConfirm) {
      setRegError(t("confirm_password") || "Пароли не совпадают");
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          name: regEmail.split("@")[0],
        }),
      });

      if (res.status === 409) {
        setRegError(t("email_exists"));
        setRegLoading(false);
        return;
      }

      if (!res.ok) {
        setRegError(t("register_error") || "Registration failed");
        setRegLoading(false);
        return;
      }

      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        setRegLoading(false);
        switchTab("login");
      }, 1500);
    } catch {
      setRegError(t("register_error") || "Registration failed");
      setRegLoading(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isLogin = tab === "login";
  const isRegister = tab === "register";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fade-in_200ms_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[420px] animate-[fade-in-up_300ms_ease-out] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="relative px-7 pt-7 pb-0">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text transition-all duration-200 cursor-pointer"
          >
            <RiCloseLine size={20} />
          </button>

          {/* Title */}
          <h2 className="text-[22px] font-bold tracking-tight text-text">
            {isLogin
              ? t("login_title") || t("login")
              : t("register_title") || t("register")}
          </h2>
          <p className="mt-1 text-[14px] text-text-secondary">
            {isLogin
              ? t("login_subtitle") || "Войдите, чтобы продолжить"
              : t("register_subtitle") || "Создайте аккаунт за минуту"}
          </p>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div className="mx-7 mt-5 flex rounded-lg bg-bg-secondary p-1">
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 rounded-md py-2 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
              isLogin
                ? "bg-white text-text shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {t("login")}
          </button>
          <button
            onClick={() => switchTab("register")}
            className={`flex-1 rounded-md py-2 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
              isRegister
                ? "bg-white text-text shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {t("register_title") || t("register")}
          </button>
        </div>

        {/* ── Forms ───────────────────────────────────────────────── */}
        <div className="px-7 pt-5 pb-7">
          {/* ── Login ── */}
          {isLogin && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="flex items-center gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                  <RiErrorWarningFill size={16} className="shrink-0" />
                  {loginError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-text">
                  {t("email")}
                </label>
                <AuthInput
                  icon={RiMailLine}
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="baspen@inbox.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-text">
                  {t("password")}
                </label>
                <PasswordInput
                  required
                  show={showLoginPassword}
                  onToggle={() => setShowLoginPassword(!showLoginPassword)}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t("password_placeholder") || "Введите пароль"}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60 cursor-pointer"
              >
                {loginLoading && (
                  <RiLoader4Line size={18} className="animate-spin" />
                )}
                {t("login")}
              </button>

              <p className="text-center text-[13px] text-text-secondary">
                {t("no_account") || "Нет аккаунта?"}{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  {t("register_title") || t("register")}
                </button>
              </p>
            </form>
          )}

          {/* ── Register ── */}
          {isRegister && (
            <>
              {regSuccess ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <RiCheckboxCircleFill size={28} className="text-success" />
                  </div>
                  <p className="text-[15px] font-medium text-text">
                    {t("register_success")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {regError && (
                    <div className="flex items-center gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                      <RiErrorWarningFill size={16} className="shrink-0" />
                      {regError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-text">
                      {t("email")}
                    </label>
                    <AuthInput
                      icon={RiMailLine}
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="baspen@inbox.com"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-text">
                      {t("password")}
                    </label>
                    <PasswordInput
                      required
                      show={showRegPassword}
                      onToggle={() => setShowRegPassword(!showRegPassword)}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder={
                        t("password_placeholder") || "Введите пароль"
                      }
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-text">
                      {t("confirm_password_label") || "Подтвердить пароль"}
                    </label>
                    <PasswordInput
                      required
                      show={showRegConfirm}
                      onToggle={() => setShowRegConfirm(!showRegConfirm)}
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder={
                        t("password_placeholder") || "Введите пароль"
                      }
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60 cursor-pointer"
                  >
                    {regLoading && (
                      <RiLoader4Line size={18} className="animate-spin" />
                    )}
                    {t("register_submit")}
                  </button>

                  <p className="text-center text-[13px] text-text-secondary">
                    {t("have_account") || "Уже есть аккаунт?"}{" "}
                    <button
                      type="button"
                      onClick={() => switchTab("login")}
                      className="font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {t("login")}
                    </button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
