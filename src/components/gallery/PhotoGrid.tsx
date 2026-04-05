"use client";

import { useTranslations } from "next-intl";
import { useEventPhotos } from "@/hooks/usePhotos";
import { useState } from "react";
import { Lightbox } from "./Lightbox";
import { RiImageLine } from "@remixicon/react";

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
          <button
            key={photo.id}
            onClick={() => setLightboxIndex(index)}
            className="aspect-square overflow-hidden rounded-lg bg-bg-secondary hover:opacity-90 transition-opacity"
          >
            <img
              src={photo.thumbnailPath || ""}
              alt={photo.originalFilename || ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={readyPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
