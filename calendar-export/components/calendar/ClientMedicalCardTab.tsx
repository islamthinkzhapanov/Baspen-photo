"use client";

import { useState, useMemo } from "react";
import { Loader2, Pencil, Save, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { useClient, useUpdateClient } from "@/hooks/useClients";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/tremor/Select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/tremor/Popover";
import { cn } from "@/lib/utils";

const GENDER_LABELS: Record<string, string> = {
  male: "Муж",
  female: "Жен",
};

function formatBirthDate(dateStr: string): string {
  try {
    const birth = new Date(dateStr + "T00:00:00");
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    const formatted = birth.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `${formatted} (${age} лет)`;
  } catch {
    return dateStr;
  }
}

const SKIN_TYPES = [
  { value: "", label: "Не указано" },
  { value: "normal", label: "Нормальная" },
  { value: "dry", label: "Сухая" },
  { value: "oily", label: "Жирная" },
  { value: "combination", label: "Комбинированная" },
  { value: "sensitive", label: "Чувствительная" },
];

const SKIN_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SKIN_TYPES.filter((s) => s.value).map((s) => [s.value, s.label])
);

interface MedicalField {
  key: string;
  label: string;
  type: "textarea" | "select";
}

const MEDICAL_FIELDS: MedicalField[] = [
  { key: "allergies", label: "Аллергия", type: "textarea" },
  { key: "contraindications", label: "Противопоказания", type: "textarea" },
  { key: "chronicDiseases", label: "Хронические заболевания", type: "textarea" },
  { key: "medications", label: "Прием лекарств", type: "textarea" },
  { key: "skinType", label: "Тип кожи", type: "select" },
  { key: "pregnancyNote", label: "Беременность / кормление", type: "textarea" },
];

interface ClientMedicalCardTabProps {
  clientId: string;
  /** "sheet" = 1 column (appointment modal), "page" = 2 columns (client profile) */
  layout?: "sheet" | "page";
}

export function ClientMedicalCardTab({ clientId, layout = "sheet" }: ClientMedicalCardTabProps) {
  const { data: client, isLoading } = useClient(clientId);
  const updateClient = useUpdateClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [birthPickerOpen, setBirthPickerOpen] = useState(false);

  const initialForm = useMemo((): Record<string, string> => {
    if (!client) return {};
    return {
      gender: client.gender ?? "",
      birthDate: client.birthDate ?? "",
      allergies: client.allergies ?? "",
      contraindications: client.contraindications ?? "",
      chronicDiseases: client.chronicDiseases ?? "",
      medications: client.medications ?? "",
      skinType: client.skinType ?? "",
      pregnancyNote: client.pregnancyNote ?? "",
    };
  }, [client]);

  const isDirty = isEditing && Object.keys(initialForm).some(
    (key) => (form[key] ?? "") !== (initialForm[key] ?? "")
  );

  function startEditing() {
    if (!client) return;
    setForm({ ...initialForm });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setForm({});
  }

  async function handleSave() {
    try {
      await updateClient.mutateAsync({
        id: clientId,
        gender: (form.gender as "male" | "female") || null,
        birthDate: form.birthDate || null,
        allergies: form.allergies || null,
        contraindications: form.contraindications || null,
        chronicDiseases: form.chronicDiseases || null,
        medications: form.medications || null,
        skinType: form.skinType || null,
        pregnancyNote: form.pregnancyNote || null,
      });
      toast.success("Карточка клиента сохранена");
      setIsEditing(false);
    } catch {
      toast.error("Не удалось сохранить");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12 text-sm text-gray-400">
        Клиент не найден
      </div>
    );
  }

  const gridClass = layout === "page"
    ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
    : "space-y-3";

  return (
    <div className="space-y-4 pb-3">
      {/* Header with edit button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Медицинская карта</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Редактировать
          </button>
        )}
      </div>

      {/* Birthday + Gender row */}
      {isEditing ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Дата рождения
            </label>
            <Popover open={birthPickerOpen} onOpenChange={setBirthPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-left outline-none transition-colors hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400",
                    !form.birthDate && "text-gray-400"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  {form.birthDate
                    ? format(parse(form.birthDate, "yyyy-MM-dd", new Date()), "d MMMM yyyy", { locale: ru })
                    : "Не указано"}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-3">
                <Calendar
                  mode="single"
                  locale={ru}
                  selected={form.birthDate ? parse(form.birthDate, "yyyy-MM-dd", new Date()) : undefined}
                  onSelect={(date) => {
                    setForm((prev) => ({
                      ...prev,
                      birthDate: date ? format(date, "yyyy-MM-dd") : "",
                    }));
                    setBirthPickerOpen(false);
                  }}
                  defaultMonth={form.birthDate ? parse(form.birthDate, "yyyy-MM-dd", new Date()) : new Date(1995, 0)}
                  captionLayout="dropdown"
                  hideNavigation
                  fromYear={1930}
                  toYear={new Date().getFullYear()}
                  className="w-full"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Пол
            </label>
            <div className="flex gap-2">
              {([
                { value: "female", label: "Жен" },
                { value: "male", label: "Муж" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      gender: prev.gender === opt.value ? "" : opt.value,
                    }))
                  }
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                    form.gender === opt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 px-3.5 py-3">
            <span className="text-xs text-gray-400">Дата рождения</span>
            <p className={cn(
              "text-sm font-medium mt-0.5",
              client.birthDate ? "text-gray-900" : "text-gray-400"
            )}>
              {client.birthDate ? formatBirthDate(client.birthDate) : "Не указано"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 px-3.5 py-3">
            <span className="text-xs text-gray-400">Пол</span>
            <p className={cn(
              "text-sm font-medium mt-0.5",
              client.gender ? "text-gray-900" : "text-gray-400"
            )}>
              {client.gender ? GENDER_LABELS[client.gender] ?? client.gender : "Не указано"}
            </p>
          </div>
        </div>
      )}

      {/* Medical fields */}
      <div className={gridClass}>
        {MEDICAL_FIELDS.map((field) => {
          const rawValue = (client as unknown as Record<string, unknown>)[field.key] as string | null;
          const displayValue = field.type === "select"
            ? (rawValue && SKIN_TYPE_LABELS[rawValue]) ?? null
            : rawValue;

          return (
            <div key={field.key}>
              {isEditing ? (
                <>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <Select
                      value={form[field.key] || "__none__"}
                      onValueChange={(v) =>
                        setForm((prev) => ({ ...prev, [field.key]: v === "__none__" ? "" : v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Не указано" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKIN_TYPES.map((opt) => (
                          <SelectItem key={opt.value || "__none__"} value={opt.value || "__none__"}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <textarea
                      value={form[field.key] ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      rows={layout === "sheet" ? 2 : 1}
                      placeholder="Не указано"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                    />
                  )}
                </>
              ) : (
                <div className="rounded-xl bg-gray-50 px-3.5 py-3">
                  <span className="text-xs text-gray-400">{field.label}</span>
                  <p className={cn(
                    "text-sm font-medium mt-0.5 break-words",
                    displayValue ? "text-gray-900" : "text-gray-400"
                  )}>
                    {displayValue || "Не указано"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky footer buttons — only when data changed */}
      {isDirty && (
        <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex gap-2 z-10">
          <button
            type="button"
            onClick={handleSave}
            disabled={updateClient.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {updateClient.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Сохранить
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}
