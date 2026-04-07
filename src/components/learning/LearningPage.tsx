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

type ModuleStatus = "completed" | "in_progress" | "locked";

const modules: {
  id: number;
  title: string;
  description: string;
  icon: typeof RiBookOpenLine;
  durationMin: number;
  status: ModuleStatus;
  lessons: { title: string; done: boolean }[];
}[] = [];

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
