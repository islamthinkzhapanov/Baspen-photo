"use client";

import { useTranslations } from "next-intl";
import {
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiDeleteBinLine,
  RiShieldLine,
  RiSmartphoneLine,
} from "@remixicon/react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  TextInput,
  Button,
} from "@tremor/react";
import { toast } from "sonner";

export function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const ts = useTranslations("settings");
  const { data: session } = useSession();

  const defaultProfile = {
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
  };

  const [profile, setProfile] = useState(defaultProfile);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (session?.user && !initializedRef.current) {
      setProfile({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: "",
      });
      initializedRef.current = true;
    }
  }, [session]);

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasProfileChanges =
    profile.name !== (session?.user?.name || "") ||
    profile.email !== (session?.user?.email || "");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
      </div>

      {/* Avatar + Info */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
            {profile.name.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold">{profile.name || "—"}</p>
            <p className="text-sm text-text-secondary">{profile.email}</p>
            <p className="text-xs text-primary mt-0.5 capitalize">
              {ts("role_user")}
            </p>
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
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">{t("email")}</label>
            <TextInput
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">{t("phone")}</label>
            <TextInput
              value={profile.phone}
              placeholder={t("phone_placeholder")}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
        </div>
        {hasProfileChanges && (
          <div className="flex justify-end mt-4">
            <Button>{tc("save")}</Button>
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
              <div className="relative">
                <TextInput
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                >
                  {showCurrent ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">{t("new_password")}</label>
              <div className="relative">
                <TextInput
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                >
                  {showNew ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">{t("confirm_password")}</label>
              <TextInput
                type="password"
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
          {!showDeleteConfirm && (
            <Button
              variant="secondary"
              size="xs"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("delete_account")}
            </Button>
          )}
        </div>
        {showDeleteConfirm && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{t("delete_confirm")}</p>
            <div className="flex gap-2">
              <Button
                className="bg-red-600 hover:bg-red-700 border-red-600"
                onClick={() => {
                  // TODO: call API to delete account
                }}
              >
                {t("delete_account")}
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                {tc("cancel")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
