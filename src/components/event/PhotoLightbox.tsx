"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckboxCircleLine,
  RiCheckboxCircleFill,
  RiShareLine,
  RiDownloadLine,
  RiLoader4Line,
  RiImageLine,
} from "@remixicon/react";
import type { SearchPhoto } from "@/hooks/useSearch";

interface PhotoLightboxProps {
  photos: SearchPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  likes: Set<string>;
  onToggleLike: (id: string) => void;
  isFreeDownload: boolean;
}

export function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  likes,
  onToggleLike,
  isFreeDownload,
}: PhotoLightboxProps) {
  const t = useTranslations("public");
  const [downloading, setDownloading] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    },
    [currentIndex, photos.length, onClose, onNavigate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const photo = photos[currentIndex];
  if (!photo) return null;

  const isLiked = likes.has(photo.id);

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      style={{ animation: "fade-in 0.2s ease-out" }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4">
        <span className="text-white/60 text-sm tabular-nums">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <RiCloseLine size={20} className="text-white" />
        </button>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          className="absolute left-3 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <RiArrowLeftSLine size={24} className="text-white" />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          className="absolute right-3 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <RiArrowRightSLine size={24} className="text-white" />
        </button>
      )}

      <div
        className="rounded-xl max-w-3xl w-full mx-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          aspectRatio: `${photo.width || 4}/${photo.height || 3}`,
          maxHeight: "80vh",
        }}
      >
        <div className="w-full h-full flex items-center justify-center relative">
          {(photo.watermarked_path || photo.thumbnail_path) ? (
            <img
              src={photo.watermarked_path || photo.thumbnail_path || undefined}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <RiImageLine size={64} className="text-white/20" />
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 safe-area-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-2 px-4 py-5 bg-gradient-to-t from-black/60 to-transparent">
          <button
            onClick={() => onToggleLike(photo.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg backdrop-blur-sm text-sm font-medium transition-colors ${
              isLiked
                ? "bg-blue-500 text-white"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {isLiked ? <RiCheckboxCircleFill size={16} /> : <RiCheckboxCircleLine size={16} />}
            {isLiked ? "Выбрано" : "Выбрать"}
          </button>
          <button
            onClick={async () => {
              const photoUrl = `${window.location.origin}/photo/${photo.id}`;
              if (navigator.share) {
                try { await navigator.share({ url: photoUrl }); } catch {}
              } else {
                await navigator.clipboard.writeText(photoUrl);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm text-sm font-medium transition-colors"
          >
            <RiShareLine size={16} />
            {t("share")}
          </button>
          <button
            disabled={downloading}
            onClick={async () => {
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
              } catch {} finally {
                setDownloading(false);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover text-sm font-medium transition-colors"
          >
            {downloading ? <RiLoader4Line size={16} className="animate-spin" /> : <RiDownloadLine size={16} />}
            {t("download")}
          </button>
        </div>
      </div>
    </div>
  );
}
