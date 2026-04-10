"use client";

import { useTranslations } from "next-intl";
import {
  RiLockLine,
  RiDeleteBinLine,
  RiShieldLine,
  RiSmartphoneLine,
  RiCameraLine,
  RiCloseLine,
  RiAlertLine,
} from "@remixicon/react";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  Card,
  TextInput,
  Button,
} from "@tremor/react";
import { toast } from "sonner";

function formatPhone(d: string) {
  let r = "+7";
  if (d.length > 0) r += ` (${d.slice(0, 3)}`;
  if (d.length >= 3) r += `) ${d.slice(3, 6)}`;
  if (d.length >= 6) r += `-${d.slice(6, 8)}`;
  if (d.length >= 8) r += `-${d.slice(8, 10)}`;
  return r;
}

function extractDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("7") && digits.length > 1) return digits.slice(1);
  if (digits.startsWith("8") && digits.length > 1) return digits.slice(1);
  return digits;
}

export function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const ts = useTranslations("settings");
  const { data: session, update } = useSession();

  const [name, setName] = useState(session?.user?.name || "");
  const email = session?.user?.email || "";
  const [phoneDigits, setPhoneDigits] = useState("");
  const [occupation, setOccupation] = useState("");

  // Track initial values for dirty check
  const [initialName, setInitialName] = useState(session?.user?.name || "");
  const [initialPhoneDigits, setInitialPhoneDigits] = useState("");
  const [initialOccupation, setInitialOccupation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image || "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile data from server
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          if (data.phone) {
            const digits = extractDigits(data.phone);
            setPhoneDigits(digits);
            setInitialPhoneDigits(digits);
          }
          if (data.occupation) {
            setOccupation(data.occupation);
            setInitialOccupation(data.occupation);
          }
          if (data.name) {
            setName(data.name);
            setInitialName(data.name);
          }
          if (data.image) setAvatarUrl(data.image);
        }
      })
      .catch(() => {});
  }, []);

  const phone = formatPhone(phoneDigits);
  const isDirty = name !== initialName || phoneDigits !== initialPhoneDigits || occupation !== initialOccupation;

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneDigits.length === 10 ? `+7${phoneDigits}` : undefined,
          occupation: occupation.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      await update();
      setInitialName(name.trim());
      setInitialPhoneDigits(phoneDigits);
      setInitialOccupation(occupation.trim());
      toast.success(t("profile_saved"));
    } catch {
      toast.error(t("save_error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("avatar_too_large"));
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvatarUrl(data.url);
      await update();
      toast.success(t("avatar_updated"));
    } catch {
      toast.error(t("avatar_error"));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleAvatarDelete() {
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAvatarUrl("");
      await update();
      toast.success(t("avatar_deleted"));
    } catch {
      toast.error(t("avatar_error"));
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleUpdatePassword() {
    if (newPassword.length < 8) {
      toast.error(t("password_too_short"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("password_mismatch"));
      return;
    }
    // TODO: call API to update password
    toast.success(t("password_updated"));
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/profile", { method: "DELETE" });
      if (!res.ok) throw new Error();
      await signOut({ callbackUrl: "/login" });
    } catch {
      toast.error(t("delete_error"));
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
          <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
        </div>

        {/* Avatar + Info */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-20 h-20 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
                  {name.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <RiCameraLine size={20} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold">{name || "—"}</p>
              <p className="text-sm text-text-secondary">{email}</p>
              <p className="text-xs text-primary mt-0.5 capitalize">
                {ts("role_user")}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl ? t("avatar_change") : t("avatar_upload")}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    className="text-xs text-text-secondary hover:text-red-500 hover:underline cursor-pointer"
                    onClick={handleAvatarDelete}
                  >
                    {t("avatar_remove")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Personal info */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4">{t("personal_info")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-secondary block mb-1">{t("name")}</label>
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">{t("email")}</label>
              <TextInput
                type="email"
                value={email}
                disabled
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">{t("phone")}</label>
              <input
                type="tel"
                value={phone}
                className="w-full rounded-tremor-default border border-tremor-border px-3 py-2 text-tremor-default shadow-tremor-input focus:border-tremor-brand focus:ring-1 focus:ring-tremor-brand outline-none h-[38px]"
                placeholder="+7 (___) ___-__-__"
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
              <label className="text-xs text-text-secondary block mb-1">{t("occupation")}</label>
              <TextInput
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder={t("occupation_placeholder")}
              />
            </div>
          </div>
          {isDirty && (
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveProfile} loading={saving}>
                {tc("save")}
              </Button>
            </div>
          )}
        </Card>

        {/* Change password */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center">
                <RiLockLine size={20} className="text-text-secondary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">{t("change_password")}</h2>
                <p className="text-xs text-text-secondary">{t("change_password_desc")}</p>
              </div>
            </div>
            {!showPasswordForm && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setShowPasswordForm(true)}
              >
                {tc("edit") ?? "Изменить"}
              </Button>
            )}
          </div>

          {showPasswordForm && (
            <div className="mt-4 space-y-3 max-w-md">
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t("current_password")}</label>
                <TextInput
                  type="password"
                  placeholder={t("password_placeholder")}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t("new_password")}</label>
                <TextInput
                  type="password"
                  placeholder={t("new_password_placeholder")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">{t("confirm_password")}</label>
                <TextInput
                  type="password"
                  placeholder={t("confirm_password_placeholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleUpdatePassword}>{t("update_password")}</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  {tc("cancel")}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Sessions */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center">
              <RiSmartphoneLine size={20} className="text-text-secondary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t("sessions")}</h2>
              <p className="text-xs text-text-secondary">{t("sessions_desc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary">
            <RiShieldLine size={16} className="text-success shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("current_session")}</p>
              <p className="text-xs text-text-secondary truncate">
                {typeof navigator !== "undefined" ? navigator.userAgent.split(" ").slice(0, 3).join(" ") : "—"}
              </p>
            </div>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="p-5 border-red-200 dark:border-red-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <RiDeleteBinLine size={20} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">{t("danger_zone")}</h2>
                <p className="text-xs text-text-secondary">{t("delete_account_desc")}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="xs"
              className="border-red-200 hover:bg-red-50 text-red-500"
              onClick={() => setShowDeleteModal(true)}
            >
              {t("delete_account")}
            </Button>
          </div>
        </Card>
      </div>

      {/* Delete account confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-bg border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text cursor-pointer"
            >
              <RiCloseLine size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <RiAlertLine size={20} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold">{t("delete_modal_title")}</h2>
            </div>

            <p className="text-sm text-text-secondary mb-4">
              {t("delete_modal_desc")}
            </p>

            <ul className="text-sm text-text-secondary space-y-2 mb-6 list-disc pl-5">
              <li>{t("delete_consequence_1")}</li>
              <li>{t("delete_consequence_2")}</li>
              <li>{t("delete_consequence_3")}</li>
            </ul>

            <div className="flex gap-3">
              <Button
                className="bg-red-600 hover:bg-red-700 border-red-600 flex-1"
                loading={deleteLoading}
                onClick={handleDeleteAccount}
              >
                {t("delete_confirm_btn")}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                {tc("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
