"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  RiShoppingCartLine,
  RiBox3Line,
  RiCloseLine,
  RiBankCardLine,
  RiLoader4Line,
  RiCheckLine,
} from "@remixicon/react";
import { Button, TextInput } from "@tremor/react";
import { useCreateOrder, useEventPricing } from "@/hooks/useOrders";

interface PurchaseDialogProps {
  eventId: string;
  selectedPhotoIds: string[];
  allPhotoIds: string[];
  sessionToken?: string;
  onClose: () => void;
  onSuccess: (downloadToken: string) => void;
}

export function PurchaseDialog({
  eventId,
  selectedPhotoIds,
  allPhotoIds,
  sessionToken,
  onClose,
  onSuccess,
}: PurchaseDialogProps) {
  const t = useTranslations("purchase");
  const { data: pricing, isLoading: pricingLoading } =
    useEventPricing(eventId);
  const createOrder = useCreateOrder();

  const [mode, setMode] = useState<"single" | "package">(
    selectedPhotoIds.length > 0 ? "single" : "package"
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  if (pricingLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-bg rounded-2xl p-8 text-center">
          <span className="animate-spin inline-flex"><RiLoader4Line size={24} /></span>
        </div>
      </div>
    );
  }

  if (!pricing || pricing.freeDownload) {
    onClose();
    return null;
  }

  const photoIds = mode === "package" ? allPhotoIds : selectedPhotoIds;
  const count = photoIds.length;
  const singleTotal = pricing.pricePerPhoto * count;
  const packageTotal = Math.round(
    singleTotal * (1 - pricing.packageDiscount / 100)
  );
  const total = mode === "package" ? packageTotal : singleTotal;
  const savings = mode === "package" ? singleTotal - packageTotal : 0;

  function handlePurchase() {
    if (!email && !phone) return;

    createOrder.mutate(
      {
        eventId,
        photoIds,
        isPackage: mode === "package",
        email: email || undefined,
        phone: phone || undefined,
        paymentMethod: "manual", // Will be replaced with real provider
        sessionToken,
      },
      {
        onSuccess: (data) => {
          if (data.downloadToken) {
            onSuccess(data.downloadToken);
          } else if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-bg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-secondary rounded-lg"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("single")}
              disabled={selectedPhotoIds.length === 0}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                mode === "single"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border-active"
              } ${selectedPhotoIds.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RiShoppingCartLine size={20} className="mb-1" />
              <div className="font-medium text-sm">{t("buy_selected")}</div>
              <div className="text-xs text-text-secondary">
                {selectedPhotoIds.length} {t("photos")}
              </div>
              <div className="font-semibold mt-1">
                {(pricing.pricePerPhoto * selectedPhotoIds.length).toLocaleString()}{" "}
                {t("currency_kzt")}
              </div>
            </button>

            <button
              onClick={() => setMode("package")}
              className={`p-3 rounded-xl border-2 text-left transition-colors relative ${
                mode === "package"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border-active"
              }`}
            >
              {pricing.packageDiscount > 0 && (
                <span className="absolute -top-2 -right-2 bg-success text-white text-xs px-2 py-0.5 rounded-full">
                  -{pricing.packageDiscount}%
                </span>
              )}
              <RiBox3Line size={20} className="mb-1" />
              <div className="font-medium text-sm">{t("buy_all")}</div>
              <div className="text-xs text-text-secondary">
                {allPhotoIds.length} {t("photos")}
              </div>
              <div className="font-semibold mt-1">
                {packageTotal.toLocaleString()} {t("currency_kzt")}
              </div>
            </button>
          </div>

          {/* Savings banner */}
          {mode === "package" && savings > 0 && (
            <div className="bg-success/10 text-success text-sm p-3 rounded-lg text-center font-medium">
              {t("savings", { amount: savings.toLocaleString() })}
            </div>
          )}

          {/* Contact info */}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-text-secondary block mb-1">
                Email
              </label>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">
                {t("phone")}
              </label>
              <TextInput
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-border pt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">
                {count} {t("photos")} x {pricing.pricePerPhoto.toLocaleString()}{" "}
                {t("currency_kzt")}
              </span>
              <span>{singleTotal.toLocaleString()} {t("currency_kzt")}</span>
            </div>
            {mode === "package" && savings > 0 && (
              <div className="flex justify-between text-sm text-success mb-1">
                <span>{t("discount")}</span>
                <span>-{savings.toLocaleString()} {t("currency_kzt")}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg mt-2">
              <span>{t("total")}</span>
              <span>
                {total.toLocaleString()} {t("currency_kzt")}
              </span>
            </div>
          </div>

          {/* Pay button */}
          <Button
            onClick={handlePurchase}
            disabled={createOrder.isPending || (!email && !phone)}
            className="w-full"
            size="lg"
          >
            <span className="flex items-center justify-center gap-2">
              {createOrder.isPending ? (
                <span className="animate-spin inline-flex"><RiLoader4Line size={20} /></span>
              ) : createOrder.isSuccess ? (
                <>
                  <RiCheckLine size={20} />
                  {t("paid")}
                </>
              ) : (
                <>
                  <RiBankCardLine size={20} />
                  {t("pay")} {total.toLocaleString()} {t("currency_kzt")}
                </>
              )}
            </span>
          </Button>

          {createOrder.isError && (
            <p className="text-sm text-red-500 text-center">
              {createOrder.error.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
