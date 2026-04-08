"use client";

import { useTranslations } from "next-intl";
import {
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiFullscreenLine,
  RiLoader4Line,
} from "@remixicon/react";
import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Photo {
  id: string;
  thumbnailPath: string | null;
  publicPath?: string | null;
  storagePath: string;
  originalFilename: string | null;
}

interface Props {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onChange: (index: number) => void;
  onDelete?: (photoId: string) => void;
}

export function Lightbox({ photos, currentIndex, onClose, onChange, onDelete }: Props) {
  const t = useTranslations("gallery");
  const router = useRouter();
  const photo = photos[currentIndex];
  const [downloading, setDownloading] = useState(false);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) onChange(currentIndex + 1);
  }, [currentIndex, photos.length, onChange]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onChange(currentIndex - 1);
  }, [currentIndex, onChange]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      touchStart.current = null;
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    [goNext, goPrev]
  );

  const handleDownload = useCallback(async () => {
    if (!photo) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}/download`);
      const { url, filename } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Ignore
    } finally {
      setDownloading(false);
    }
  }, [photo]);

  const openDetail = useCallback(() => {
    if (!photo) return;
    onClose();
    router.push(`/photo/${photo.id}`);
  }, [photo, onClose, router]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 text-white z-10" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm">
          {t("photo_of", {
            current: currentIndex + 1,
            total: photos.length,
          })}
        </span>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={() => onDelete(photo.id)}
              className="p-2 hover:bg-white/10 rounded-full text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title={t("delete_photo")}
            >
              <RiDeleteBinLine size={20} />
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-2 hover:bg-white/10 rounded-full"
            title={t("download")}
          >
            {downloading ? (
              <span className="animate-spin inline-flex"><RiLoader4Line size={20} /></span>
            ) : (
              <RiDownloadLine size={20} />
            )}
          </button>
          <button
            onClick={openDetail}
            className="p-2 hover:bg-white/10 rounded-full"
            title="Full view"
          >
            <RiFullscreenLine size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <RiCloseLine size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
        >
          <RiArrowLeftSLine size={24} />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
        >
          <RiArrowRightSLine size={24} />
        </button>
      )}

      {/* Image */}
      <img
        src={photo.publicPath || photo.thumbnailPath || ""}
        alt={photo.originalFilename || ""}
        className="max-h-[85vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
