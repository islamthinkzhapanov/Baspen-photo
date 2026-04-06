"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useOrderStatus } from "@/hooks/useOrders";
import { Link } from "@/i18n/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Suspense } from "react";

function OrderContent() {
  const t = useTranslations("order");
  const params = useParams<{ id: string }>();
  const { data, isLoading, error } = useOrderStatus(params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h1 className="text-xl font-semibold mb-1">{t("order_not_found")}</h1>
          <p className="text-text-secondary text-sm">
            {t("order_not_found_desc")}
          </p>
        </div>
      </div>
    );
  }

  const providerLabels: Record<string, string> = {
    kaspi: "Kaspi Pay",
    stripe: t("payment_method"),
    manual: t("payment_method"),
  };

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Status icon and message */}
        <div className="text-center mb-8">
          {data.status === "pending" && (
            <>
              <div className="relative inline-flex">
                <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
              </div>
              <h1 className="text-2xl font-bold mb-1">{t("pending_title")}</h1>
              <p className="text-text-secondary">{t("pending_desc")}</p>
            </>
          )}

          {data.status === "paid" && (
            <>
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <h1 className="text-2xl font-bold mb-1">{t("paid_title")}</h1>
              <p className="text-text-secondary">{t("paid_desc")}</p>
            </>
          )}

          {(data.status === "expired" || data.status === "failed") && (
            <>
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h1 className="text-2xl font-bold mb-1">
                {data.status === "expired"
                  ? t("expired_title")
                  : t("failed_title")}
              </h1>
              <p className="text-text-secondary">
                {data.status === "expired"
                  ? t("expired_desc")
                  : t("failed_desc")}
              </p>
            </>
          )}

          {data.status === "refunded" && (
            <>
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h1 className="text-2xl font-bold mb-1">
                {t("refunded_title")}
              </h1>
              <p className="text-text-secondary">{t("refunded_desc")}</p>
            </>
          )}
        </div>

        {/* Order summary card */}
        <div className="bg-bg-secondary rounded-2xl p-4 mb-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3">
            {t("order_summary")}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t("event")}</span>
              <span className="font-medium">{data.eventTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">
                {t("photos_count", { count: data.photoCount })}
              </span>
              <span className="font-medium">
                {data.isPackage ? "Package" : "Single"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t("payment_method")}</span>
              <span className="font-medium">
                {providerLabels[data.paymentProvider] || data.paymentProvider}
              </span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between font-semibold">
              <span>{t("total")}</span>
              <span>
                {data.totalAmount.toLocaleString("ru-RU")} {data.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {data.status === "paid" && data.downloadToken && (
            <Link
              href={`/download?token=${data.downloadToken}`}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="w-5 h-5" />
              {t("download_photos")}
            </Link>
          )}

          {(data.status === "expired" || data.status === "failed") &&
            data.eventSlug && (
              <Link
                href={`/e/${data.eventSlug}`}
                className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                {t("retry_payment")}
              </Link>
            )}

          {data.eventSlug && (
            <Link
              href={`/e/${data.eventSlug}`}
              className="flex items-center justify-center gap-2 w-full text-text-secondary py-3 px-4 rounded-xl font-medium hover:bg-bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("back_to_event")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
