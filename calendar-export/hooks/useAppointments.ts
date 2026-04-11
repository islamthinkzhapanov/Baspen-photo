"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateAppointmentInput, UpdateAppointmentInput } from "@/lib/validators/appointment";
import { timeToMinutes, minutesToTime } from "@/lib/time";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentServiceItem {
  id: string;
  appointmentId: string;
  serviceId: string | null;
  name: string;
  price: string;
  cost: string;
  durationMin: number;
}

export interface AppointmentClient {
  id: string;
  fullName: string;
  phone: string | null;
  status: string;
}

export interface AppointmentSpecialist {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string | null;
  specialistId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "no_show" | "awaiting_payment";
  discountPercent: string;
  discountAmount: string;
  totalPrice: string;
  prepaymentAmount: string;
  cancelReason: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  client: AppointmentClient | null;
  specialist: AppointmentSpecialist | null;
  services: AppointmentServiceItem[];
  /** True if there's a pending Kaspi prepayment invoice for this appointment */
  kaspiPending?: boolean;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAppointments(filters: { date?: string; specialistId?: string } = {}) {
  const { date, specialistId } = filters;
  return useQuery<Appointment[]>({
    queryKey: ["appointments", date, specialistId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (specialistId) params.set("specialist_id", specialistId);
      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
  });
}

export function useAvailability(
  specialistId: string | undefined,
  date: string | undefined,
  duration: number | undefined,
  excludeAppointmentId?: string
) {
  return useQuery<AvailabilitySlot[]>({
    queryKey: ["availability", specialistId, date, duration, excludeAppointmentId],
    queryFn: async () => {
      const params = new URLSearchParams({
        specialist_id: specialistId!,
        date: date!,
        duration: String(duration!),
      });
      if (excludeAppointmentId) {
        params.set("exclude_appointment_id", excludeAppointmentId);
      }
      const res = await fetch(`/api/appointments/availability?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      const json = await res.json();
      // API returns { slots: ["09:00", "09:30", ...], isWorking, workStart, workEnd }
      const raw = json.slots ?? json;
      if (!Array.isArray(raw)) return [];
      // Slots may be strings or objects — normalize to AvailabilitySlot[]
      return raw.map((s: string | AvailabilitySlot) =>
        typeof s === "string" ? { startTime: s, endTime: "" } : s
      );
    },
    enabled: !!specialistId && !!date && !!duration && duration > 0,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAppointmentInput) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 409) {
        const err = await res.json();
        throw Object.assign(new Error("TIME_CONFLICT"), { code: "TIME_CONFLICT", ...err });
      }
      if (res.status === 422) {
        const err = await res.json();
        throw Object.assign(new Error(err.error), err);
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err.error === "string" ? err.error : "Ошибка при создании записи";
        throw new Error(msg);
      }
      return res.json() as Promise<Appointment & { prepayment?: { required: boolean; amount: number } | null }>;
    },
    onSuccess: (data) => {
      const hasPrepayment = !!(data as any).prepayment?.required;
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      if (!hasPrepayment) {
        queryClient.invalidateQueries({ queryKey: ["calendar-day"] });
        queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
      }
    },
  });
}

function applyAppointmentUpdate(appt: Appointment, id: string, data: UpdateAppointmentInput): Appointment {
  if (appt.id !== id) return appt;
  const durationMin = timeToMinutes(appt.endTime) - timeToMinutes(appt.startTime);
  const newStart = data.startTime ?? appt.startTime;
  const newEnd = data.endTime
    ? data.endTime
    : data.startTime
      ? minutesToTime(timeToMinutes(data.startTime) + durationMin)
      : appt.endTime;
  return {
    ...appt,
    startTime: newStart,
    endTime: newEnd,
    ...(data.specialistId && { specialistId: data.specialistId }),
    ...(data.date && { date: data.date }),
    ...(data.status && { status: data.status }),
    ...(data.notes !== undefined && { notes: data.notes }),
  };
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointmentInput }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 409) {
        const err = await res.json();
        throw Object.assign(new Error(err.error ?? "CONFLICT"), { code: err.error, ...err });
      }
      if (res.status === 422) {
        const err = await res.json();
        throw Object.assign(new Error(err.error), err);
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to update appointment");
      }
      const result = await res.json() as Appointment;
      console.log("[updateAppointment] sent:", data, "got back specialistId:", result.specialistId);
      return result;
    },
    onMutate: async ({ id, data }) => {
      // Skip optimistic update for complex edits (services/client changes)
      if (data.services || data.clientId !== undefined) return {};

      await queryClient.cancelQueries({ queryKey: ["calendar-day"] });
      await queryClient.cancelQueries({ queryKey: ["calendar-week"] });

      const prevDay = queryClient.getQueriesData({ queryKey: ["calendar-day"] });
      const prevWeek = queryClient.getQueriesData({ queryKey: ["calendar-week"] });

      queryClient.setQueriesData({ queryKey: ["calendar-day"] }, (old: any) => {
        if (!old?.appointments) return old;
        return { ...old, appointments: old.appointments.map((a: Appointment) => applyAppointmentUpdate(a, id, data)) };
      });

      queryClient.setQueriesData({ queryKey: ["calendar-week"] }, (old: any) => {
        if (!old?.days) return old;
        return {
          ...old,
          days: old.days.map((day: any) => ({
            ...day,
            appointments: day.appointments.map((a: Appointment) => applyAppointmentUpdate(a, id, data)),
          })),
        };
      });

      return { prevDay, prevWeek };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevDay) {
        for (const [key, val] of ctx.prevDay) queryClient.setQueryData(key, val);
      }
      if (ctx?.prevWeek) {
        for (const [key, val] of ctx.prevWeek) queryClient.setQueryData(key, val);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-day"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (res.status === 403) throw new Error("Forbidden: only owner/admin can delete appointments");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to delete appointment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-day"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-week"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
