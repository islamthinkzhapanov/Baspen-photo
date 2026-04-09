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
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
      {photos.map((photo, index) => {
        const isLiked = likes.has(photo.id);
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
                <img
                  src={imgSrc}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RiImageLine size={32} className="text-gray-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>

            <div className="absolute bottom-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike(photo.id);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm transition-colors ${
                  isLiked
                    ? "bg-red-500 text-white"
                    : "bg-white/90 text-text-secondary hover:text-red-500"
                }`}
              >
                {isLiked ? <RiHeartFill size={14} /> : <RiHeartLine size={14} />}
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
              >
                <RiShareLine size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
