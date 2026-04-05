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
import { Card, ProgressBar, Badge } from "@tremor/react";

// --- Demo data ---

const modules = [
  {
    id: 1,
    title: "Начало работы",
    description: "Регистрация, создание первого проекта и настройка профиля",
    icon: RiBookOpenLine,
    duration: "5 мин",
    status: "completed" as const,
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
    duration: "8 мин",
    status: "completed" as const,
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
    duration: "6 мин",
    status: "in_progress" as const,
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
    duration: "10 мин",
    status: "locked" as const,
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
    duration: "7 мин",
    status: "locked" as const,
    lessons: [
      { title: "QR-код для мероприятия", done: false },
      { title: "Виджет для сайта", done: false },
      { title: "Спонсорские блоки", done: false },
      { title: "Брендированные рамки для шеринга", done: false },
    ],
  },
];

const statusStyles = {
  completed: {
    badgeColor: "green" as const,
    label: "Пройден",
    icon: RiCheckboxCircleLine,
  },
  in_progress: {
    badgeColor: "blue" as const,
    label: "В процессе",
    icon: RiPlayLine,
  },
  locked: {
    badgeColor: "gray" as const,
    label: "Заблокирован",
    icon: RiLockLine,
  },
};

// --- Component ---

export function LearningPage() {
  const t = useTranslations();

  const completedCount = modules.filter((m) => m.status === "completed").length;
  const progress = Math.round((completedCount / modules.length) * 100);

  return (
    <div className="space-y-6 max-w-[800px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">{t("nav.learning")}</h1>
        <p className="text-sm text-text-secondary mt-1">
          Изучите все возможности платформы за 5 уроков
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Ваш прогресс</span>
          <span className="text-sm text-text-secondary">
            {completedCount} из {modules.length} модулей
          </span>
        </div>
        <ProgressBar value={progress} color="blue" />
        <p className="text-xs text-text-secondary mt-2">{progress}% завершено</p>
      </Card>

      {/* Modules */}
      <div className="space-y-3">
        {modules.map((mod) => {
          const st = statusStyles[mod.status];
          const StIcon = st.icon;
          const ModIcon = mod.icon;
          const isLocked = mod.status === "locked";

          return (
            <Card
              key={mod.id}
              className={`p-5 transition-colors ${
                isLocked ? "opacity-60" : "hover:border-border-active cursor-pointer"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    mod.status === "completed"
                      ? "bg-success/10 text-success"
                      : mod.status === "in_progress"
                      ? "bg-primary/10 text-primary"
                      : "bg-bg-secondary text-text-secondary"
                  }`}
                >
                  <ModIcon size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{mod.title}</h3>
                    <Badge color={st.badgeColor} size="xs">
                      <span className="inline-flex items-center gap-1">
                        <StIcon size={12} />
                        {st.label}
                      </span>
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

                <div className="flex items-center gap-1 text-xs text-text-secondary flex-shrink-0">
                  <RiTimeLine size={14} />
                  {mod.duration}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
