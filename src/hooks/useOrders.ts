"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { EventPricing, Order } from "@/types/api";
import type { CreateOrderInput } from "@/lib/validators/order";

export function useEventPricing(eventId: string) {
  return useQuery<EventPricing>({
    queryKey: ["events", eventId, "pricing"],
    queryFn: () => fetchJson(`/api/events/${eventId}/pricing`),
    enabled: !!eventId,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (data: CreateOrderInput) =>
      fetchJson<any>("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}

export function useDownloadPhotos(token: string | null) {
  return useQuery({
    queryKey: ["download", token],
    queryFn: () => fetchJson<any>(`/api/orders/download?token=${token}`),
    enabled: !!token,
  });
}

export function useOrderStatus(orderId: string | null) {
  return useQuery<Order>({
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
