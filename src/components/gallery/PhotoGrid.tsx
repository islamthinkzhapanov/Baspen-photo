"use client";

import { useTranslations } from "next-intl";
import { useEventPhotos, useDeletePhoto } from "@/hooks/usePhotos";
import { useState } from "react";
import { Lightbox } from "./Lightbox";
import { RiImageLine, RiEyeLine, RiDeleteBinLine } from "@remixicon/react";

interface Photo {
  id: string;
  thumbnailPath: string | null;
  storagePath: string;
  originalFilename: string | null;
  width: number | null;
  height: number | null;
  status: string;
}

export function PhotoGrid({ eventId }: { eventId: string }) {
  const t = useTranslations("gallery");
  const { data: photos, isLoading } = useEventPhotos(eventId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const deleteMutation = useDeletePhoto(eventId);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-square bg-bg-secondary rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!photos?.length) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-3">
          <RiImageLine size={40} className="text-text-secondary" />
        </div>
        <h3 className="font-medium">{t("no_photos")}</h3>
        <p className="text-sm text-text-secondary">{t("no_photos_desc")}</p>
      </div>
    );
  }

  const readyPhotos = photos.filter((p: Photo) => p.status === "ready");
  const processingPhotos = photos.filter(
    (p: Photo) => p.status === "processing"
  );

  return (
    <div>
      {processingPhotos.length > 0 && (
        <div className="mb-4 text-sm text-text-secondary flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {processingPhotos.length} processing...
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {readyPhotos.map((photo: Photo, index: number) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg bg-bg-secondary"
          >
            <img
              src={photo.thumbnailPath || ""}
              alt={photo.originalFilename || ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setLightboxIndex(index)}
                className="p-2.5 bg-white/90 hover:bg-white rounded-full text-gray-800 transition-colors cursor-pointer"
                title={t("view")}
              >
                <RiEyeLine size={20} />
              </button>
              <button
                onClick={() => setDeleteConfirmId(photo.id)}
                className="p-2.5 bg-white/90 hover:bg-white rounded-full text-red-500 transition-colors cursor-pointer"
                title={t("delete_photo")}
              >
                <RiDeleteBinLine size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={readyPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
          onDelete={(photoId) => setDeleteConfirmId(photoId)}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-bg rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-text mb-1">
              {t("delete_confirm")}
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              {t("delete_confirm_desc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                  hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deleteConfirmId, {
                    onSuccess: () => {
                      // If deleting from lightbox, adjust index
                      if (lightboxIndex !== null) {
                        const deletedIndex = readyPhotos.findIndex(
                          (p: Photo) => p.id === deleteConfirmId
                        );
                        if (readyPhotos.length <= 1) {
                          setLightboxIndex(null);
                        } else if (
                          deletedIndex <= lightboxIndex &&
                          lightboxIndex > 0
                        ) {
                          setLightboxIndex(lightboxIndex - 1);
                        }
                      }
                      setDeleteConfirmId(null);
                    },
                  });
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium
                  hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
