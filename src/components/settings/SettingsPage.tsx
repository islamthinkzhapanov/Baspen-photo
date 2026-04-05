"use client";

import { useTranslations } from "next-intl";
import {
  RiUserLine,
  RiNotification3Line,
  RiBankCardLine,
  RiGlobalLine,
  RiShieldLine,
  RiCameraLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import { useState } from "react";
import {
  Card,
  TextInput,
  Select,
  SelectItem,
  Button,
} from "@tremor/react";
import { Switch } from "@/components/ui/switch";

// --- Demo data ---

const demoProfile = {
  name: "Арман Сериков",
  email: "arman@baspen.kz",
  phone: "+7 707 123 45 67",
  avatar: null,
  role: "owner",
  language: "ru",
  timezone: "Asia/Almaty",
};

// --- Component ---

export function SettingsPage() {
  const t = useTranslations();
  const [profile, setProfile] = useState(demoProfile);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email_purchases: true,
    email_uploads: false,
    push_searches: true,
    push_withdrawals: true,
  });

  const notificationItems = [
    { key: "email_purchases", label: t("settings.notif_purchases"), desc: t("settings.notif_purchases_desc") },
    { key: "email_uploads", label: t("settings.notif_uploads"), desc: t("settings.notif_uploads_desc") },
    { key: "push_searches", label: t("settings.notif_searches"), desc: t("settings.notif_searches_desc") },
    { key: "push_withdrawals", label: t("settings.notif_withdrawals"), desc: t("settings.notif_withdrawals_desc") },
  ];

  const quickLinks = [
    { icon: RiBankCardLine, label: t("settings.payment_data"), desc: t("settings.payment_data_desc") },
    { icon: RiCameraLine, label: t("settings.camera_keys"), desc: t("settings.camera_keys_desc") },
    { icon: RiShieldLine, label: t("settings.security"), desc: t("settings.security_desc") },
  ];

  return (
    <div className="space-y-6 max-w-[700px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("settings.title")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* Profile Section */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <RiUserLine size={16} className="text-text-secondary" />
          {t("settings.profile")}
        </h2>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {profile.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{profile.name}</p>
            <p className="text-sm text-text-secondary">{profile.email}</p>
            <p className="text-xs text-primary mt-0.5 capitalize">
              {profile.role === "owner" ? t("settings.role_owner") : t("settings.role_photographer")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-secondary block mb-1">{t("settings.name")}</label>
            <TextInput
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">{t("settings.email")}</label>
            <TextInput
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">{t("settings.phone")}</label>
            <TextInput
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <RiNotification3Line size={16} className="text-text-secondary" />
          {t("settings.notifications")}
        </h2>

        <div className="space-y-3">
          {notificationItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-text-secondary">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(val) =>
                  setNotifications({
                    ...notifications,
                    [item.key]: val,
                  })
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <RiGlobalLine size={16} className="text-text-secondary" />
          {t("settings.preferences")}
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{t("settings.language")}</p>
            </div>
            <Select
              value={profile.language}
              onValueChange={(val) => setProfile({ ...profile, language: val })}
              enableClear={false}
              className="w-auto"
            >
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="kz">Қазақша</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{t("settings.timezone")}</p>
            </div>
            <Select
              value={profile.timezone}
              onValueChange={(val) => setProfile({ ...profile, timezone: val })}
              enableClear={false}
              className="w-auto"
            >
              <SelectItem value="Asia/Almaty">Алматы (UTC+6)</SelectItem>
              <SelectItem value="Asia/Aqtau">Актау (UTC+5)</SelectItem>
              <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{t("settings.dark_mode")}</p>
              <p className="text-xs text-text-secondary">{t("settings.dark_mode_soon")}</p>
            </div>
            <Switch
              checked={darkMode}
              onChange={setDarkMode}
              disabled
            />
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <Card className="p-0 overflow-hidden">
        {quickLinks.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-bg-secondary transition-colors border-b border-border last:border-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-text-secondary">{item.desc}</p>
              </div>
              <RiArrowRightSLine size={16} className="text-text-secondary" />
            </button>
          );
        })}
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button>{t("common.save")}</Button>
      </div>
    </div>
  );
}
