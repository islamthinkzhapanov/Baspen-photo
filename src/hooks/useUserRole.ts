"use client";

import { useSession } from "next-auth/react";

export function useUserRole() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? null;
  return {
    role,
    isAdmin: role === "super_admin",
    isUser: role === "user",
  };
}
