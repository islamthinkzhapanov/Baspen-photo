"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useEffect } from "react";
import { TextInput, Button, Callout } from "@tremor/react";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiErrorWarningLine,
  RiCheckLine,
  RiCloseLine,
} from "@remixicon/react";

type Tab = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

export default function AuthModal({ open, onClose, initialTab = "login" }: AuthModalProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);

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
        body: JSON.stringify({ email: regEmail, password: regPassword, name: regEmail.split("@")[0] }),
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-text-secondary hover:text-text transition-colors cursor-pointer z-10"
        >
          <RiCloseLine size={20} />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "login"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {t("login")}
          </button>
          <button
            onClick={() => switchTab("register")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "register"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {t("register_title") || t("register")}
          </button>
        </div>

        <div className="p-6">
          {/* ─── Login Tab ─── */}
          {tab === "login" && (
            <div>
              {loginError && (
                <div className="mb-5">
                  <Callout title={loginError} icon={RiErrorWarningLine} color="red" />
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    {t("email")}
                  </label>
                  <TextInput
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="baspen@inbox.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    {t("password")}
                  </label>
                  <div className="relative flex items-center rounded-tremor-default border border-tremor-border bg-tremor-background shadow-tremor-input focus-within:ring-1 focus-within:ring-tremor-brand">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={t("password_placeholder") || "Введите пароль"}
                      className="w-full bg-transparent py-2 pl-3 pr-10 text-tremor-default text-tremor-content-emphasis placeholder:text-tremor-content-subtle outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-2 p-1 text-tremor-content-subtle hover:text-tremor-content-emphasis transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? <RiEyeLine size={16} /> : <RiEyeOffLine size={16} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" loading={loginLoading} className="w-full cursor-pointer">
                  {t("login")}
                </Button>
              </form>
            </div>
          )}

          {/* ─── Register Tab ─── */}
          {tab === "register" && (
            <div>
              {regSuccess ? (
                <div className="py-4">
                  <Callout title={t("register_success")} icon={RiCheckLine} color="green" />
                </div>
              ) : (
                <>
                  {regError && (
                    <div className="mb-5">
                      <Callout title={regError} icon={RiErrorWarningLine} color="red" />
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        {t("email")}
                      </label>
                      <TextInput
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="baspen@inbox.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        {t("password")}
                      </label>
                      <div className="relative flex items-center rounded-tremor-default border border-tremor-border bg-tremor-background shadow-tremor-input focus-within:ring-1 focus-within:ring-tremor-brand">
                        <input
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder={t("password_placeholder") || "Введите пароль"}
                          className="w-full bg-transparent py-2 pl-3 pr-10 text-tremor-default text-tremor-content-emphasis placeholder:text-tremor-content-subtle outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2 p-1 text-tremor-content-subtle hover:text-tremor-content-emphasis transition-colors cursor-pointer"
                        >
                          {showRegPassword ? <RiEyeLine size={16} /> : <RiEyeOffLine size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        {t("confirm_password_label") || "Подтвердить пароль"}
                      </label>
                      <div className="relative flex items-center rounded-tremor-default border border-tremor-border bg-tremor-background shadow-tremor-input focus-within:ring-1 focus-within:ring-tremor-brand">
                        <input
                          type={showRegConfirm ? "text" : "password"}
                          required
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
                          placeholder={t("password_placeholder") || "Введите пароль"}
                          className="w-full bg-transparent py-2 pl-3 pr-10 text-tremor-default text-tremor-content-emphasis placeholder:text-tremor-content-subtle outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirm(!showRegConfirm)}
                          className="absolute right-2 p-1 text-tremor-content-subtle hover:text-tremor-content-emphasis transition-colors cursor-pointer"
                        >
                          {showRegConfirm ? <RiEyeLine size={16} /> : <RiEyeOffLine size={16} />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" loading={regLoading} className="w-full cursor-pointer">
                      {t("register_submit")}
                    </Button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
