"use client";

import {
  RiImageLine,
  RiHeartLine,
  RiHeartFill,
  RiShareLine,
} from "@remixicon/react";
import type { SearchPhoto } from "@/hooks/useSearch";

interface PhotoMasonryGridProps {
  photos: SearchPhoto[];
  likes: Set<string>;
  onToggleLike: (id: string) => void;
  onPhotoClick: (index: number) => void;
}

export function PhotoMasonryGrid({
  photos,
  likes,
  onToggleLike,
  onPhotoClick,
}: PhotoMasonryGridProps) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
      {photos.map((photo, index) => {
        const isLiked = likes.has(photo.id);
        const staggerDelay = Math.min(index * 40, 400);
        const imgSrc = photo.thumbnail_path;
        return (
          <div
            key={photo.id}
            className="mb-3 break-inside-avoid group relative"
            style={{
              opacity: 0,
              animation: `masonry-fade-in 0.5s ease-out ${staggerDelay}ms forwards`,
            }}
          >
            <div
              className="bg-gray-100 rounded-xl overflow-hidden cursor-pointer relative"
              style={{ aspectRatio: `${photo.width || 4}/${photo.height || 3}` }}
              onClick={() => onPhotoClick(index)}
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RiImageLine size={32} className="text-white/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike(photo.id);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur ${
                  isLiked
                    ? "bg-red-500 text-white"
                    : "bg-white/80 text-text-secondary hover:text-red-500"
                }`}
              >
                {isLiked ? <RiHeartFill size={16} /> : <RiHeartLine size={16} />}
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-text-secondary hover:text-primary"
              >
                <RiShareLine size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
