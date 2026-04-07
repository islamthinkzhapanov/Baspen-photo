"use client";

import { useTranslations } from "next-intl";
import {
  RiNotification3Line,
  RiBankCardLine,
  RiGlobalLine,
  RiKey2Line,
  RiShieldLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import { useState } from "react";
import {
  Card,
  Select,
  SelectItem,
  Button,
} from "@tremor/react";
import { Switch } from "@/components/ui/switch";

export function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  const [language, setLanguage] = useState("ru");
  const [timezone, setTimezone] = useState("Asia/Almaty");

  const initialNotifications = {
    email_purchases: true,
    email_uploads: false,
    push_searches: true,
    push_withdrawals: true,
  };
  const [notifications, setNotifications] = useState(initialNotifications);

  const notificationItems = [
    { key: "email_purchases", label: t("notif_purchases"), desc: t("notif_purchases_desc") },
    { key: "email_uploads", label: t("notif_uploads"), desc: t("notif_uploads_desc") },
    { key: "push_searches", label: t("notif_searches"), desc: t("notif_searches_desc") },
    { key: "push_withdrawals", label: t("notif_withdrawals"), desc: t("notif_withdrawals_desc") },
  ];

  const quickLinks = [
    { key: "payment", icon: RiBankCardLine, label: t("payment_data"), desc: t("payment_data_desc") },
    { key: "camera", icon: RiKey2Line, label: t("camera_keys"), desc: t("camera_keys_desc") },
    { key: "security", icon: RiShieldLine, label: t("security"), desc: t("security_desc") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notifications */}
        <Card className="p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <RiNotification3Line size={16} className="text-text-secondary" />
            {t("notifications")}
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
        <Card className="p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <RiGlobalLine size={16} className="text-text-secondary" />
            {t("preferences")}
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1.5">{t("language")}</p>
              <Select
                value={language}
                onValueChange={setLanguage}
                enableClear={false}
              >
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="kz">Қазақша</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium mb-1.5">{t("timezone")}</p>
              <Select
                value={timezone}
                onValueChange={setTimezone}
                enableClear={false}
              >
                <SelectItem value="Asia/Almaty">Алматы (UTC+6)</SelectItem>
                <SelectItem value="Asia/Aqtau">Актау (UTC+5)</SelectItem>
                <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
              </Select>
            </div>
          </div>
        </Card>

        {/* Quick links */}
        <Card className="p-5 lg:col-span-1">
          <div className="space-y-1">
            {quickLinks.map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-secondary transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-text-secondary">{desc}</p>
                </div>
                <RiArrowRightSLine size={18} className="text-text-secondary shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
