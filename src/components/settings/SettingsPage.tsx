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
  Switch,
  Button,
} from "@tremor/react";

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

  return (
    <div className="space-y-6 max-w-[700px]">
      <h1 className="text-2xl font-bold font-display">{t("nav.settings")}</h1>

      {/* Profile Section */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <RiUserLine size={16} className="text-text-secondary" />
          Профиль
        </h2>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {profile.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{profile.name}</p>
            <p className="text-sm text-text-secondary">{profile.email}</p>
            <p className="text-xs text-primary mt-0.5 capitalize">
              {profile.role === "owner" ? "Организатор" : "Фотограф"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Имя</label>
            <TextInput
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Email</label>
            <TextInput
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Телефон</label>
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
          Уведомления
        </h2>

        <div className="space-y-3">
          {[
            { key: "email_purchases", label: "Покупки фото", desc: "Email при каждой покупке" },
            { key: "email_uploads", label: "Загрузки фото", desc: "Email при завершении обработки" },
            { key: "push_searches", label: "Активность поиска", desc: "Когда участники ищут фото" },
            { key: "push_withdrawals", label: "Выплаты", desc: "Статус вывода средств" },
          ].map((item) => (
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
          Предпочтения
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Язык интерфейса</p>
              <p className="text-xs text-text-secondary">Русский</p>
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
              <p className="text-sm font-medium">Часовой пояс</p>
              <p className="text-xs text-text-secondary">{profile.timezone}</p>
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
              <p className="text-sm font-medium">Тёмная тема</p>
              <p className="text-xs text-text-secondary">Скоро</p>
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
        {[
          { icon: RiBankCardLine, label: "Платёжные данные", desc: "Kaspi Gold •4821" },
          { icon: RiCameraLine, label: "API-ключи камеры", desc: "2 активных ключа" },
          { icon: RiShieldLine, label: "Безопасность", desc: "Двухфакторная аутентификация" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-bg-secondary transition-colors border-b border-border last:border-0"
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
