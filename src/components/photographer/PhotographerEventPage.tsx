"use client";

import { useState, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import {
  RiImageLine,
  RiCalendarLine,
  RiMapPinLine,
  RiEyeLine,
  RiDeleteBinLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiLoader4Line,
  RiCheckboxLine,
  RiCheckboxBlankLine,
  RiCheckboxFill,
} from "@remixicon/react";
import { useEvent } from "@/hooks/useEvents";
import { useEventPhotos, useDeletePhoto, useBulkDeletePhotos, useProcessingStatus } from "@/hooks/usePhotos";
import { PhotoUploadZone } from "@/components/upload/PhotoUploadZone";

interface Photo {
  id: string;
  uploadedBy: string;
  thumbnailPath: string | null;
  watermarkedPath: string | null;
  storagePath: string;
  originalFilename: string | null;
  status: string;
  createdAt: string;
}

const PHOTOS_PER_PAGE = 100;

/* ─── Photo Lightbox ─── */

function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onChange,
  onDelete,
}: {
  photos: Photo[];
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

  const imageUrl = photo.watermarkedPath || photo.thumbnailPath;

  const handleDelete = () => {
    onDelete(photo.id);
    setShowDeleteConfirm(false);
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
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-red-400 hover:text-red-300"
            title={t("delete_photo")}
          >
            <RiDeleteBinLine size={20} />
          </button>
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
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={photo.originalFilename || ""}
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

/* ─── Processing Status Bar ─── */

function ProcessingBar({ eventId }: { eventId: string }) {
  const t = useTranslations("photographer");
  const { data: status } = useProcessingStatus(eventId);

  if (!status || status.processing === 0) return null;

  const percent = Math.round(((status.ready + status.failed) / status.total) * 100);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl text-sm">
      <RiLoader4Line size={16} className="text-primary animate-spin shrink-0" />
      <span className="text-text-secondary">
        {t("processing_status", {
          ready: status.ready,
          total: status.total,
        })}
      </span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {status.failed > 0 && (
        <span className="text-xs text-red-500">
          {status.failed} {t("failed")}
        </span>
      )}
    </div>
  );
}

/* ─── Delete Confirmation Modal ─── */

function DeleteConfirmModal({
  title,
  description,
  onCancel,
  onConfirm,
  isPending,
  t,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
        <p className="text-sm text-text-secondary mb-5">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
              hover:bg-bg-secondary transition-colors cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium
              hover:bg-red-600 transition-colors cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {isPending && (
              <RiLoader4Line size={16} className="animate-spin" />
            )}
            {t("delete")}
          </button>
        </div>
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

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<"selected" | "all" | null>(null);

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: allPhotos, isLoading: photosLoading } = useEventPhotos(eventId);
  const deleteMutation = useDeletePhoto(eventId);
  const bulkDeleteMutation = useBulkDeletePhotos(eventId);

  const photos: Photo[] = allPhotos ?? [];
  const readyPhotos = photos.filter((p: Photo) => p.status === "ready");

  const pagePhotos = readyPhotos.slice(
    (currentPage - 1) * PHOTOS_PER_PAGE,
    currentPage * PHOTOS_PER_PAGE
  );

  const handlePhotoClick = (pageIndex: number) => {
    if (selectionMode) {
      toggleSelect(pagePhotos[pageIndex].id);
      return;
    }
    setLightboxIndex(pageIndex);
  };

  const handleDelete = (photoId: string) => {
    deleteMutation.mutate(photoId, {
      onSuccess: () => {
        if (lightboxIndex !== null) {
          if (pagePhotos.length <= 1) {
            setLightboxIndex(null);
          } else if (lightboxIndex >= pagePhotos.length - 1) {
            setLightboxIndex(lightboxIndex - 1);
          }
        }
      },
    });
  };

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pagePhotos.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const allOnPageSelected = pagePhotos.length > 0 && pagePhotos.every((p) => selectedIds.has(p.id));

  const handleBulkDelete = () => {
    if (confirmAction === "all") {
      bulkDeleteMutation.mutate(
        { all: true },
        {
          onSuccess: () => {
            setConfirmAction(null);
            exitSelectionMode();
            setCurrentPage(1);
          },
        }
      );
    } else if (confirmAction === "selected") {
      bulkDeleteMutation.mutate(
        { photoIds: Array.from(selectedIds) },
        {
          onSuccess: () => {
            setConfirmAction(null);
            exitSelectionMode();
          },
        }
      );
    }
  };

  if (eventLoading || photosLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-text-secondary">
        <RiLoader4Line size={20} className="animate-spin" />
        <span>{te("loading")}</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">{te("not_found") || "Проект не найден"}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">{event.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
          {event.date && (
            <span className="flex items-center gap-1">
              <RiCalendarLine size={14} />
              {new Date(event.date).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1">
              <RiMapPinLine size={14} />
              {event.location}
            </span>
          )}
        </div>
      </div>

      {/* Photos */}
      <div className="space-y-4">
        {/* Upload zone */}
        <PhotoUploadZone eventId={eventId} />

        {/* Processing status */}
        <ProcessingBar eventId={eventId} />

        {/* Photo count + actions */}
        {readyPhotos.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text">
              <RiImageLine size={16} className="text-text-secondary" />
              {t("uploaded_count", { count: readyPhotos.length.toLocaleString("ru-RU") })}
            </span>

            <div className="flex items-center gap-2">
              {!selectionMode ? (
                <>
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="h-8 px-3 text-xs font-medium rounded-lg border border-border
                      hover:bg-bg-secondary transition-colors cursor-pointer
                      flex items-center gap-1.5"
                  >
                    <RiCheckboxLine size={14} />
                    {t("select")}
                  </button>
                  <button
                    onClick={() => setConfirmAction("all")}
                    className="h-8 px-3 text-xs font-medium rounded-lg border border-red-200
                      text-red-500 hover:bg-red-50 transition-colors cursor-pointer
                      flex items-center gap-1.5"
                  >
                    <RiDeleteBinLine size={14} />
                    {t("delete_all")}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={allOnPageSelected ? deselectAll : selectAllOnPage}
                    className="h-8 px-3 text-xs font-medium rounded-lg border border-border
                      hover:bg-bg-secondary transition-colors cursor-pointer
                      flex items-center gap-1.5"
                  >
                    {allOnPageSelected ? (
                      <RiCheckboxFill size={14} className="text-primary" />
                    ) : (
                      <RiCheckboxBlankLine size={14} />
                    )}
                    {allOnPageSelected ? t("deselect_all") : t("select_all_page")}
                  </button>

                  {selectedIds.size > 0 && (
                    <button
                      onClick={() => setConfirmAction("selected")}
                      className="h-8 px-3 text-xs font-medium rounded-lg
                        bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer
                        flex items-center gap-1.5"
                    >
                      <RiDeleteBinLine size={14} />
                      {t("delete_selected", { count: selectedIds.size })}
                    </button>
                  )}

                  <button
                    onClick={exitSelectionMode}
                    className="h-8 px-3 text-xs font-medium rounded-lg border border-border
                      hover:bg-bg-secondary transition-colors cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Photo grid or empty state */}
        {readyPhotos.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {pagePhotos.map((photo, idx) => {
                const thumbUrl = photo.thumbnailPath || photo.watermarkedPath;
                const isSelected = selectedIds.has(photo.id);
                return (
                  <div
                    key={photo.id}
                    onClick={() => handlePhotoClick(idx)}
                    className={`aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group relative overflow-hidden cursor-pointer
                      ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                  >
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={photo.originalFilename || ""}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <RiImageLine size={24} className="text-gray-300" />
                    )}

                    {/* Selection checkbox */}
                    {selectionMode && (
                      <div className="absolute top-1.5 left-1.5 z-10">
                        {isSelected ? (
                          <RiCheckboxFill size={22} className="text-primary drop-shadow-md" />
                        ) : (
                          <RiCheckboxBlankLine size={22} className="text-white drop-shadow-md" />
                        )}
                      </div>
                    )}

                    {/* Hover overlay (only when not in selection mode) */}
                    {!selectionMode && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePhotoClick(idx); }}
                          className="p-2 bg-white/90 hover:bg-white rounded-full text-gray-800 transition-colors cursor-pointer"
                          title={t("view")}
                        >
                          <RiEyeLine size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                          className="p-2 bg-white/90 hover:bg-white rounded-full text-red-500 transition-colors cursor-pointer"
                          title={t("delete_photo")}
                        >
                          <RiDeleteBinLine size={18} />
                        </button>
                      </div>
                    )}

                    {/* Dim overlay for selected photos */}
                    {selectionMode && isSelected && (
                      <div className="absolute inset-0 bg-primary/10" />
                    )}
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={readyPhotos.length}
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
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              {t("empty_desc")}
            </p>
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

      {/* Bulk delete confirmation */}
      {confirmAction && (
        <DeleteConfirmModal
          title={
            confirmAction === "all"
              ? t("delete_all_confirm", { count: readyPhotos.length })
              : t("delete_selected_confirm", { count: selectedIds.size })
          }
          description={t("delete_bulk_desc")}
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleBulkDelete}
          isPending={bulkDeleteMutation.isPending}
          t={t}
        />
      )}
    </div>
  );
}
