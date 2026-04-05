"use client";

import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { Lightbox } from "./Lightbox";
import { PurchaseDialog } from "./PurchaseDialog";
import {
  RiDownloadLine,
  RiHeartLine,
  RiCameraLine,
  RiHashtag,
  RiArrowLeftLine,
  RiShoppingCartLine,
  RiCheckLine,
} from "@remixicon/react";
import { Button } from "@tremor/react";
import type { SearchPhoto } from "@/hooks/useSearch";

interface Props {
  photos: SearchPhoto[];
  eventId: string;
  eventTitle: string;
  isFreeDownload?: boolean;
  sessionToken?: string;
  onSearchByFace: () => void;
  onSearchByNumber: () => void;
  onBack: () => void;
}

export function SearchResultsGrid({
  photos,
  eventId,
  eventTitle,
  isFreeDownload,
  sessionToken,
  onSearchByFace,
  onSearchByNumber,
  onBack,
}: Props) {
  const t = useTranslations("public");
  const tp = useTranslations("purchase");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPurchase, setShowPurchase] = useState(false);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);

  // Normalize field names (API returns snake_case from raw SQL)
  const normalizedPhotos = photos.map((p) => ({
    id: p.id,
    thumbnailPath: p.thumbnail_path ?? null,
    watermarkedPath: p.watermarked_path ?? null,
    storagePath: "",
    originalFilename: null,
    width: p.width,
    height: p.height,
    similarity: p.similarity,
  }));

  const toggleSelect = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }, []);

  const allPhotoIds = photos.map((p) => p.id);

  return (
    <div className="min-h-screen bg-bg">
      {/* Results header */}
      <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-bg-secondary rounded-full"
            >
              <RiArrowLeftLine size={20} />
            </button>
            <div>
              <h1 className="font-semibold text-sm">{eventTitle}</h1>
              <p className="text-xs text-text-secondary">
                {t("results", { count: photos.length })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFreeDownload && photos.length > 0 && (
              <Button
                onClick={() => setShowPurchase(true)}
                size="xs"
              >
                <span className="flex items-center gap-1.5">
                  {downloadToken ? (
                    <>
                      <RiCheckLine size={16} />
                      {tp("purchased")}
                    </>
                  ) : (
                    <>
                      <RiShoppingCartLine size={16} />
                      {selectedIds.size > 0
                        ? tp("buy_count", { count: selectedIds.size })
                        : tp("buy_all")}
                    </>
                  )}
                </span>
              </Button>
            )}
            <button
              onClick={onSearchByFace}
              className="p-2 hover:bg-bg-secondary rounded-full"
              title={t("search_by_face")}
            >
              <RiCameraLine size={20} />
            </button>
            <button
              onClick={onSearchByNumber}
              className="p-2 hover:bg-bg-secondary rounded-full"
              title={t("search_by_number")}
            >
              <RiHashtag size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Results masonry grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-lg mb-2">{t("no_results")}</p>
          <p className="text-sm">{t("try_different_search")}</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
            {normalizedPhotos.map((photo, index) => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className="mb-3 break-inside-avoid group relative"
                >
                  <button
                    onClick={() => setLightboxIndex(index)}
                    className="w-full"
                  >
                    <img
                      src={photo.watermarkedPath || photo.thumbnailPath || ""}
                      alt=""
                      className="w-full rounded-lg"
                      loading="lazy"
                    />
                  </button>

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg pointer-events-none">
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                      <button className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white">
                        <RiHeartLine size={16} />
                      </button>
                      {isFreeDownload ? (
                        <a
                          href={`/api/photos/${photo.id}/download`}
                          className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
                        >
                          <RiDownloadLine size={16} />
                        </a>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(photo.id);
                          }}
                          className={`p-2 rounded-full text-white ${
                            isSelected
                              ? "bg-primary"
                              : "bg-black/50 hover:bg-black/70"
                          }`}
                        >
                          {isSelected ? (
                            <RiCheckLine size={16} />
                          ) : (
                            <RiShoppingCartLine size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <RiCheckLine size={14} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={normalizedPhotos.map((p) => ({
            id: p.id,
            thumbnailPath: p.watermarkedPath || p.thumbnailPath,
            storagePath: p.storagePath,
            originalFilename: p.originalFilename,
          }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}

      {/* Purchase dialog */}
      {showPurchase && (
        <PurchaseDialog
          eventId={eventId}
          selectedPhotoIds={Array.from(selectedIds)}
          allPhotoIds={allPhotoIds}
          sessionToken={sessionToken}
          onClose={() => setShowPurchase(false)}
          onSuccess={(token) => {
            setDownloadToken(token);
            setShowPurchase(false);
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}
