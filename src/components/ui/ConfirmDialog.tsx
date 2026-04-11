"use client";

import { Dialog, DialogPanel, Button } from "@tremor/react";
import { RiLoader4Line } from "@remixicon/react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "danger" | "default";
  isPending?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  isPending = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={() => onOpenChange(false)}>
      <DialogPanel className="max-w-sm p-6">
        <h3 className="text-tremor-title font-semibold text-text mb-1">
          {title}
        </h3>
        <p className="text-sm text-text-secondary mb-5">{description}</p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "primary" : "primary"}
            className={
              variant === "danger"
                ? "flex-1 !bg-red-500 hover:!bg-red-600 !border-red-500"
                : "flex-1"
            }
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending && (
              <RiLoader4Line size={16} className="animate-spin mr-1.5" />
            )}
            {confirmText}
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
