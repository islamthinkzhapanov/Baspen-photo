"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import type { CreateOrderInput } from "@/lib/validators/order";

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useEventPricing(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "pricing"],
    queryFn: () => fetchJson(`/api/events/${eventId}/pricing`),
    enabled: !!eventId,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (data: CreateOrderInput) =>
      fetchJson("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}

export function useDownloadPhotos(token: string | null) {
  return useQuery({
    queryKey: ["download", token],
    queryFn: () => fetchJson(`/api/orders/download?token=${token}`),
    enabled: !!token,
  });
}

export function useOrderStatus(orderId: string | null) {
  return useQuery({
    queryKey: ["orders", orderId, "status"],
    queryFn: () => fetchJson(`/api/orders/${orderId}`),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === "paid" ||
        status === "failed" ||
        status === "expired" ||
        status === "refunded"
      ) {
        return false;
      }
      return 3000;
    },
  });
}
