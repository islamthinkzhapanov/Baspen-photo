"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCreateInvite } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { RiCloseLine, RiMailSendLine } from "@remixicon/react";
import { Button, TextInput } from "@tremor/react";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ open, onClose }: InviteModalProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const createInvite = useCreateInvite();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createInvite.mutate(
      { email: email.trim(), name: name.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("invite_sent"));
          setEmail("");
          setName("");
          onClose();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-bg border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text transition-colors"
        >
          <RiCloseLine size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center">
            <RiMailSendLine size={20} className="text-text-secondary" />
          </div>
          <h2 className="text-lg font-semibold font-display">{t("invite_user")}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("invite_email")}</label>
            <TextInput
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t("invite_name")}</label>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              loading={createInvite.isPending}
              icon={() => <RiMailSendLine size={16} className="mr-2" />}
            >
              {t("send_invite")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
