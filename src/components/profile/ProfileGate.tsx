"use client";

import { useSession } from "next-auth/react";
import { ProfileCompletionModal } from "./ProfileCompletionModal";

export function ProfileGate() {
  const { data: session, status } = useSession();

  if (status !== "authenticated") return null;
  if (session.user.profileCompleted) return null;

  return <ProfileCompletionModal />;
}
