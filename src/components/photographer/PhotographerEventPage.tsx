"use client";

import { useState, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import {
  RiImageLine,
  RiUploadLine,
  RiCalendarLine,
  RiMapPinLine,
  RiEyeLine,
  RiDeleteBinLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
} from "@remixicon/react";

// TODO: replace with real data from API
const demoEvents: Record<
  string,
  {
    id: string;
    title: string;
    date: string;
    location: string;
    photoCount: number;
    myUploads: number;
    searches: number;
    downloads: number;
  }
> = {
  "1": {
    id: "1",
    title: "Almaty Marathon 2026",
    date: "2026-03-30",
    location: "Алматы, пр. Абая",
    photoCount: 0,
    myUploads: 0,
    searches: 0,
    downloads: 0,
  },
  "2": {
    id: "2",
    title: "Nauryz Festival",
    date: "2026-03-22",
    location: "Астана, EXPO",
    photoCount: 3100,
    myUploads: 860,
    searches: 890,
    downloads: 312,
  },
  "3": {
    id: "3",
    title: "Tech Conference KZ",
    date: "2026-03-15",
    location: "Алматы, Rixos",
    photoCount: 2800,
    myUploads: 520,
    searches: 520,
    downloads: 95,
  },
};

const PHOTOS_PER_PAGE = 100;

const demoPhotos = Array.from({ length: 120 }, (_, i) => ({
  id: `p${i + 1}`,
  index: i + 1,
  uploadedByMe: i < 80,
  thumbnailPath: null as string | null,
}));

/* ─── Photo Lightbox ─── */

function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onChange,
  onDelete,
}: {
  photos: typeof demoPhotos;
  currentIndex: number;
  onClose: () => void;
  onChange: (index: number) => void;
  onDelete: (photoId: string) => void;
}) {
  const t = useTranslations("photographer");
  const photo = photos[currentIndex];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) onChange(currentIndex + 1);
  }, [currentIndex, photos.length, onChange]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onChange(currentIndex - 1);
  }, [currentIndex, onChange]);

  useEffect(() => {
    function handleKey(e: globalThis.KeyboardEvent) {
      if (showDeleteConfirm) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, goNext, goPrev, showDeleteConfirm]);

  if (!photo) return null;

  const handleDelete = () => {
    onDelete(photo.id);
    setShowDeleteConfirm(false);
    // If we deleted the last photo, go back
    if (currentIndex >= photos.length - 1 && currentIndex > 0) {
      onChange(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 text-white z-10">
        <span className="text-sm tabular-nums">
          {t("photo_of", {
            current: currentIndex + 1,
            total: photos.length,
          })}
        </span>
        <div className="flex items-center gap-1">
          {photo.uploadedByMe && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-red-400 hover:text-red-300"
              title={t("delete_photo")}
            >
              <RiDeleteBinLine size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <RiCloseLine size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors cursor-pointer"
        >
          <RiArrowLeftSLine size={24} />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors cursor-pointer"
        >
          <RiArrowRightSLine size={24} />
        </button>
      )}

      {/* Image */}
      {photo.thumbnailPath ? (
        <img
          src={photo.thumbnailPath}
          alt={`Photo #${photo.index}`}
          className="max-h-[85vh] max-w-[90vw] object-contain"
        />
      ) : (
        <div className="w-[60vw] max-w-lg aspect-[4/3] bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
          <RiImageLine size={64} className="text-gray-500" />
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <div className="bg-bg rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-text mb-1">
              {t("delete_confirm")}
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              {t("delete_confirm_desc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                  hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium
                  hover:bg-red-600 transition-colors cursor-pointer"
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

/* ─── Pagination ─── */

function Pagination({
  currentPage,
  totalItems,
  perPage,
  onPageChange,
  t,
}: {
  currentPage: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const totalPages = Math.ceil(totalItems / perPage);
  const [inputValue, setInputValue] = useState(String(currentPage));

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(totalPages, page));
      onPageChange(clamped);
      setInputValue(String(clamped));
    },
    [totalPages, onPageChange]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setInputValue(raw);
  };

  const handleInputCommit = () => {
    const num = parseInt(inputValue, 10);
    if (!num || isNaN(num)) {
      setInputValue(String(currentPage));
      return;
    }
    goToPage(num);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
      handleInputCommit();
    }
  };

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <span className="text-xs text-text-secondary tabular-nums">
        {from}&ndash;{to} / {totalItems.toLocaleString("ru-RU")}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label={t("go_to_page")}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border
            hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <RiArrowLeftSLine size={18} />
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputCommit}
          onKeyDown={handleKeyDown}
          aria-label={t("go_to_page")}
          className="h-8 w-12 rounded-lg border border-border bg-bg text-center text-sm font-medium
            text-text tabular-nums outline-none
            focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label={t("go_to_page")}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border
            hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <RiArrowRightSLine size={18} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export function PhotographerEventPage({ eventId }: { eventId: string }) {
  const t = useTranslations("photographer");
  const te = useTranslations("events");

  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const event = demoEvents[eventId];

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">{te("not_found") || "Проект не найден"}</p>
      </div>
    );
  }

  const pagePhotos = demoPhotos.slice(
    (currentPage - 1) * PHOTOS_PER_PAGE,
    currentPage * PHOTOS_PER_PAGE
  );

  const handlePhotoClick = (pageIndex: number) => {
    setLightboxIndex(pageIndex);
  };

  const handleDelete = (photoId: string) => {
    // TODO: call API to delete photo
    console.log("Delete photo:", photoId);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">{event.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <RiCalendarLine size={14} />
            {new Date(event.date).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <RiMapPinLine size={14} />
            {event.location}
          </span>
        </div>
      </div>

      {/* Photos */}
      <div className="space-y-4">
        {/* Upload zone + photo count */}
        <div className="flex items-center justify-between gap-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer flex-1">
            <RiUploadLine size={32} className="text-text-secondary mx-auto mb-2" />
            <p className="text-sm font-medium">{t("drag_drop")}</p>
            <p className="text-xs text-text-secondary mt-1">JPG, PNG, WebP до 50 МБ</p>
          </div>
        </div>

        {/* Photo count badge */}
        {demoPhotos.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text">
              <RiImageLine size={16} className="text-text-secondary" />
              {t("uploaded_count", { count: demoPhotos.length.toLocaleString("ru-RU") })}
            </span>
          </div>
        )}

        {/* Photo grid or empty state */}
        {event.photoCount > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {pagePhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(idx)}
                  className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group relative overflow-hidden cursor-pointer"
                >
                  <RiImageLine size={24} className="text-gray-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2">
                    <RiEyeLine size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {photo.uploadedByMe && (
                    <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-primary" />
                  )}
                  <span className="absolute bottom-1 right-1 text-[10px] text-gray-400">
                    #{photo.index}
                  </span>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={demoPhotos.length}
              perPage={PHOTOS_PER_PAGE}
              onPageChange={setCurrentPage}
              t={t}
            />
          </>
        ) : (
          <div className="border border-border rounded-2xl py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <RiImageLine size={36} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold font-display mb-2">{t("empty_title")}</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
              {t("empty_desc")}
            </p>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
              <RiUploadLine size={18} />
              {t("empty_select_files")}
            </button>
            <p className="text-xs text-text-secondary mt-4">{t("empty_formats")}</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={pagePhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
