"use client";

import { memo } from "react";
import {
  RiImageLine,
  RiCheckLine,
} from "@remixicon/react";
import type { SearchPhoto } from "@/hooks/useSearch";
import { ProtectedImage } from "@/components/ui/ProtectedImage";

interface PhotoMasonryGridProps {
  photos: SearchPhoto[];
  likes: Set<string>;
  onToggleLike: (id: string) => void;
  onPhotoClick: (index: number) => void;
}

export const PhotoMasonryGrid = memo(function PhotoMasonryGrid({
  photos,
  likes,
  onToggleLike,
  onPhotoClick,
}: PhotoMasonryGridProps) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
      {photos.map((photo, index) => {
        const isSelected = likes.has(photo.id);
        const staggerDelay = Math.min(index * 40, 400);
        const imgSrc = photo.thumbnail_path;
        return (
          <div
            key={photo.id}
            className="mb-4 break-inside-avoid group relative"
            style={{
              opacity: 0,
              animation: `masonry-fade-in 0.5s ease-out ${staggerDelay}ms forwards`,
            }}
          >
            <div
              className="bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative"
              style={{ aspectRatio: `${photo.width || 4}/${photo.height || 3}` }}
              onClick={() => onPhotoClick(index)}
            >
              {imgSrc ? (
                <ProtectedImage
                  src={imgSrc}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  wrapperClassName="absolute inset-0 w-full h-full"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RiImageLine size={32} className="text-gray-300" />
                </div>
              )}

              {/* Blue overlay when selected */}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/25 pointer-events-none transition-opacity duration-200" />
              )}

              {/* Hover gradient (only when not selected) */}
              {!isSelected && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              )}
            </div>

            {/* Selection circle — top-right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(photo.id);
              }}
              className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isSelected
                  ? "bg-blue-500 text-white shadow-md"
                  : "border-2 border-white/80 bg-black/30 text-white opacity-0 group-hover:opacity-100"
              }`}
            >
              {isSelected && <RiCheckLine size={18} />}
            </button>
          </div>
        );
      })}
    </div>
  );
});
