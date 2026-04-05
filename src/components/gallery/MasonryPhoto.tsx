"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  src: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
  onClick?: () => void;
  className?: string;
}

/**
 * Lazy-loaded photo with blur-up placeholder effect.
 * Uses IntersectionObserver to defer loading until visible.
 * Shows a blurred gradient placeholder until image loads.
 */
export function MasonryPhoto({
  src,
  alt = "",
  width,
  height,
  onClick,
  className = "",
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Aspect ratio for skeleton
  const aspectRatio =
    width && height ? `${width} / ${height}` : "4 / 3";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />

      {inView && (
        <button
          onClick={onClick}
          className="w-full h-full block"
          type="button"
        >
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
            loading="lazy"
            decoding="async"
          />
        </button>
      )}
    </div>
  );
}
