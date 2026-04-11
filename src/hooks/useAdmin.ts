"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";

// --- Users ---
export function useAdminUsers(params?: {
  page?: number;
  search?: string;
  role?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.search) sp.set("search", params.search);
  if (params?.role) sp.set("role", params.role);

  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => fetchJson<any>(`/api/admin/users?${sp.toString()}`),
    retry: false,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      fetchJson("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// --- Invites ---
export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; name?: string }) =>
      fetchJson("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useResendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      fetchJson("/api/admin/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// --- Events ---
export function useAdminEvents(params?: { page?: number; search?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.search) sp.set("search", params.search);

  return useQuery({
    queryKey: ["admin", "events", params],
    queryFn: () => fetchJson<any>(`/api/admin/events?${sp.toString()}`),
    retry: false,
  });
}

export function useAdminDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      fetchJson("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "events"] }),
  });
}

// --- Finance ---
export function useAdminFinance(from?: string, to?: string) {
  const sp = new URLSearchParams();
  if (from) sp.set("from", from);
  if (to) sp.set("to", to);

  return useQuery({
    queryKey: ["admin", "finance", from, to],
    queryFn: () => fetchJson<any>(`/api/admin/finance?${sp.toString()}`),
    retry: false,
  });
}

// --- Plans ---
export function useAdminPlans() {
  return useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => fetchJson<any>("/api/admin/plans"),
    retry: false,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      maxEvents: number;
      maxPhotosPerEvent: number;
      maxStorageGb: number;
      priceMonthly: number;
    }) =>
      fetchJson("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: unknown }) =>
      fetchJson("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });
}

// --- Metrics ---
export function useAdminMetrics() {
  return useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: () => fetchJson<any>("/api/admin/metrics"),
    retry: false,
  });
}

// --- Audit ---
export function useAdminAudit(params?: {
  page?: number;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.action) sp.set("action", params.action);
  if (params?.entityType) sp.set("entity_type", params.entityType);
  if (params?.from) sp.set("from", params.from);
  if (params?.to) sp.set("to", params.to);

  return useQuery({
    queryKey: ["admin", "audit", params],
    queryFn: () => fetchJson<any>(`/api/admin/audit?${sp.toString()}`),
    retry: false,
  });
}

// --- Billing (user-facing) ---
export function useMySubscription() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () => fetchJson("/api/billing/subscription"),
  });
}

export function useAvailablePlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => fetchJson("/api/billing/plans"),
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      fetchJson("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson("/api/billing/cancel", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}
