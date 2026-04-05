"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminPlans, useCreatePlan, useUpdatePlan } from "@/hooks/useAdmin";
import { RiAddLine, RiPencilLine, RiCloseLine } from "@remixicon/react";
import { toast } from "sonner";
import {
  Button,
  Card,
  TextInput,
  NumberInput,
  Badge,
} from "@tremor/react";

interface PlanForm {
  name: string;
  maxEvents: number;
  maxPhotosPerEvent: number;
  maxStorageGb: number;
  priceMonthly: number;
}

const emptyForm: PlanForm = {
  name: "",
  maxEvents: 5,
  maxPhotosPerEvent: 1000,
  maxStorageGb: 10,
  priceMonthly: 0,
};

export function PlansPage() {
  const t = useTranslations("admin");
  const { data: plans, isLoading } = useAdminPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  const [editing, setEditing] = useState<string | null>(null); // plan id or "new"
  const [form, setForm] = useState<PlanForm>(emptyForm);

  function startCreate() {
    setForm(emptyForm);
    setEditing("new");
  }

  function startEdit(plan: PlanForm & { id: string }) {
    setForm({
      name: plan.name,
      maxEvents: plan.maxEvents,
      maxPhotosPerEvent: plan.maxPhotosPerEvent,
      maxStorageGb: plan.maxStorageGb,
      priceMonthly: plan.priceMonthly,
    });
    setEditing(plan.id);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error(t("plan_name_required"));
      return;
    }

    if (editing === "new") {
      createPlan.mutate(form, {
        onSuccess: () => {
          toast.success(t("plan_created"));
          setEditing(null);
        },
        onError: (err) => toast.error(err.message),
      });
    } else if (editing) {
      updatePlan.mutate(
        { id: editing, ...form },
        {
          onSuccess: () => {
            toast.success(t("plan_updated"));
            setEditing(null);
          },
          onError: (err) => toast.error(err.message),
        }
      );
    }
  }

  function toggleActive(planId: string, isActive: boolean) {
    updatePlan.mutate(
      { id: planId, isActive: !isActive },
      {
        onSuccess: () => toast.success(t("plan_updated")),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{t("plans_title")}</h1>
        <Button icon={() => <RiAddLine size={16} />} onClick={startCreate}>
          {t("create_plan")}
        </Button>
      </div>

      {/* Edit / Create form */}
      {editing && (
        <Card className="p-4 space-y-4 bg-bg-secondary">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">
              {editing === "new" ? t("create_plan") : t("edit_plan")}
            </h2>
            <button onClick={() => setEditing(null)}>
              <RiCloseLine size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">{t("plan_name")}</label>
              <TextInput
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("max_events")}</label>
              <NumberInput
                className="mt-1"
                value={form.maxEvents}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, maxEvents: val ?? 0 }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("max_photos")}</label>
              <NumberInput
                className="mt-1"
                value={form.maxPhotosPerEvent}
                onValueChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    maxPhotosPerEvent: val ?? 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("max_storage")}</label>
              <NumberInput
                className="mt-1"
                value={form.maxStorageGb}
                onValueChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    maxStorageGb: val ?? 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("price_monthly")}</label>
              <NumberInput
                className="mt-1"
                value={form.priceMonthly}
                onValueChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    priceMonthly: val ?? 0,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {t("save_plan")}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {t("cancel")}
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans?.map(
            (plan: {
              id: string;
              name: string;
              maxEvents: number;
              maxPhotosPerEvent: number;
              maxStorageGb: number;
              priceMonthly: number;
              isActive: boolean;
              subscriberCount: number;
            }) => (
              <Card
                key={plan.id}
                className={`p-5 space-y-3 ${!plan.isActive ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(plan)}
                      className="p-1.5 hover:bg-bg-secondary rounded"
                    >
                      <RiPencilLine size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-2xl font-bold text-primary">
                  {plan.priceMonthly === 0
                    ? t("free")
                    : `${plan.priceMonthly.toLocaleString("ru-RU")} ${t("kzt_month")}`}
                </p>

                <ul className="space-y-1.5 text-sm text-text-secondary">
                  <li>{t("limit_events", { count: plan.maxEvents })}</li>
                  <li>{t("limit_photos", { count: plan.maxPhotosPerEvent })}</li>
                  <li>{t("limit_storage", { gb: plan.maxStorageGb })}</li>
                </ul>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-text-secondary">
                    {t("subscribers", { count: plan.subscriberCount })}
                  </span>
                  <button onClick={() => toggleActive(plan.id, plan.isActive)}>
                    <Badge color={plan.isActive ? "green" : "gray"} size="xs">
                      {plan.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </button>
                </div>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
