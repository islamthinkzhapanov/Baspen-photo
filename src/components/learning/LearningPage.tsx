"use client";

import { useTranslations } from "next-intl";
import {
  RiPlayLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiBookOpenLine,
  RiCameraLine,
  RiUploadLine,
  RiShareLine,
  RiBarChart2Line,
  RiLockLine,
} from "@remixicon/react";
import { Card, Badge } from "@tremor/react";

// --- Demo data ---

type ModuleStatus = "completed" | "in_progress" | "locked";

const modules: {
  id: number;
  title: string;
  description: string;
  icon: typeof RiBookOpenLine;
  durationMin: number;
  status: ModuleStatus;
  lessons: { title: string; done: boolean }[];
}[] = [
  {
    id: 1,
    title: "Начало работы",
    description: "Регистрация, создание первого проекта и настройка профиля",
    icon: RiBookOpenLine,
    durationMin: 5,
    status: "completed",
    lessons: [
      { title: "Регистрация и вход", done: true },
      { title: "Интерфейс дашборда", done: true },
      { title: "Создание первого проекта", done: true },
    ],
  },
  {
    id: 2,
    title: "Загрузка фотографий",
    description: "Как загружать фото через браузер и настроить автозагрузку с камеры",
    icon: RiUploadLine,
    durationMin: 8,
    status: "completed",
    lessons: [
      { title: "Загрузка через браузер", done: true },
      { title: "Bulk-загрузка (drag & drop)", done: true },
      { title: "API-ключи для камеры", done: true },
      { title: "Автоматическая обработка", done: true },
    ],
  },
  {
    id: 3,
    title: "Распознавание лиц",
    description: "Как работает поиск по лицу и стартовому номеру для участников",
    icon: RiCameraLine,
    durationMin: 6,
    status: "in_progress",
    lessons: [
      { title: "Как работает CompreFace", done: true },
      { title: "Оптимальные условия съёмки", done: true },
      { title: "Поиск по номеру на нагруднике", done: false },
    ],
  },
  {
    id: 4,
    title: "Продажа фото",
    description: "Настройка цен, водяных знаков и получение оплаты",
    icon: RiBarChart2Line,
    durationMin: 10,
    status: "locked",
    lessons: [
      { title: "Модели монетизации", done: false },
      { title: "Настройка цен и пакетов", done: false },
      { title: "Водяные знаки", done: false },
      { title: "Подключение Kaspi Pay", done: false },
    ],
  },
  {
    id: 5,
    title: "Дистрибуция",
    description: "QR-коды, виджеты, спонсоры и брендированные рамки",
    icon: RiShareLine,
    durationMin: 7,
    status: "locked",
    lessons: [
      { title: "QR-код для мероприятия", done: false },
      { title: "Виджет для сайта", done: false },
      { title: "Спонсорские блоки", done: false },
      { title: "Брендированные рамки для шеринга", done: false },
    ],
  },
];

const statusConfig: Record<
  ModuleStatus,
  { badgeColor: "green" | "blue" | "gray"; icon: typeof RiCheckboxCircleLine; iconBg: string }
> = {
  completed: {
    badgeColor: "green",
    icon: RiCheckboxCircleLine,
    iconBg: "bg-success/20 text-success",
  },
  in_progress: {
    badgeColor: "blue",
    icon: RiPlayLine,
    iconBg: "bg-primary/20 text-primary",
  },
  locked: {
    badgeColor: "gray",
    icon: RiLockLine,
    iconBg: "bg-bg-secondary text-text-secondary",
  },
};

// --- Component ---

export function LearningPage() {
  const t = useTranslations();

  const completedCount = modules.filter((m) => m.status === "completed").length;
  const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("learning.title")}</h1>
        <p className="text-sm text-text-secondary mt-1">
          {t("learning.subtitle", { count: modules.length })}
        </p>
      </div>

      {modules.length > 0 ? (
        <>
          {/* Progress */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">{t("learning.your_progress")}</span>
              <span className="text-sm text-text-secondary">
                {t("learning.modules_count", { done: completedCount, total: modules.length })}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              {t("learning.percent_done", { percent: progress })}
            </p>
          </Card>

          {/* Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => {
          const st = statusConfig[mod.status];
          const StIcon = st.icon;
          const ModIcon = mod.icon;
          const isLocked = mod.status === "locked";

          return (
            <Card
              key={mod.id}
              className={`p-5 transition-colors flex flex-col ${
                isLocked ? "opacity-60" : "hover:border-border-active cursor-pointer"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Module icon */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${st.iconBg}`}
                >
                  <ModIcon size={20} />
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1 text-xs text-text-secondary flex-shrink-0 ml-auto">
                  <RiTimeLine size={14} />
                  {t("learning.min", { n: mod.durationMin })}
                </div>
              </div>

              {/* Content */}
              <div className="mt-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{mod.title}</h3>
                  <Badge color={st.badgeColor} icon={StIcon} size="xs">
                    {t(`learning.status_${mod.status}`)}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary mt-1">{mod.description}</p>

                {/* Lessons */}
                <div className="mt-3 space-y-1.5">
                  {mod.lessons.map((lesson, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {lesson.done ? (
                        <RiCheckboxCircleLine size={14} className="text-success flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0" />
                      )}
                      <span className={lesson.done ? "text-text-secondary line-through" : ""}>
                        {lesson.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
          </div>
        </>
      ) : (
        <Card className="p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <RiBookOpenLine size={32} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">{t("learning.no_modules")}</h2>
            <p className="text-sm text-text-secondary mt-2">{t("learning.no_modules_desc")}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
