"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useDownloadPhotos } from "@/hooks/useOrders";
import { Download, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Suspense } from "react";

function DownloadContent() {
  const t = useTranslations("download");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { data, isLoading, error } = useDownloadPhotos(token);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h1 className="text-xl font-semibold mb-1">{t("invalid_link")}</h1>
          <p className="text-text-secondary text-sm">{t("invalid_link_desc")}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h1 className="text-xl font-semibold mb-1">{t("error")}</h1>
          <p className="text-text-secondary text-sm">
            {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  if (!data?.photos?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-3" />
          <h1 className="text-xl font-semibold">{t("no_photos")}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-1">{t("title")}</h1>
          <p className="text-text-secondary">
            {t("subtitle", { count: data.photos.length })}
          </p>
          {data.expiresAt && (
            <p className="text-xs text-text-secondary mt-2" suppressHydrationWarning>
              {t("expires", {
                date: new Date(data.expiresAt).toLocaleDateString("ru-RU"),
              })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.photos.map(
            (photo: {
              photoId: string;
              filename: string;
              thumbnailUrl: string | null;
              downloadUrl: string;
            }) => (
              <div
                key={photo.photoId}
                className="group relative rounded-xl overflow-hidden bg-bg-secondary aspect-square"
              >
                {photo.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <a
                  href={photo.downloadUrl}
                  download={photo.filename}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
                >
                  <span className="bg-white text-black px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Download className="w-4 h-4" />
                    {t("download")}
                  </span>
                </a>
              </div>
            )
          )}
        </div>

        {/* Download all */}
        {data.photos.length > 1 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary mb-2">
              {t("download_individually")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  );
}
