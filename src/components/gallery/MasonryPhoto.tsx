"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  src: string;
  srcAvif?: string | null;
  alt?: string;
  width?: number | null;
  height?: number | null;
  placeholder?: string | null;
  index?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Lazy-loaded photo with blur-up placeholder effect.
 * Uses IntersectionObserver to defer loading until visible.
 * Shows a real blurred placeholder (base64) or gradient fallback until image loads.
 * Supports staggered fade-in via index prop.
 */
export function MasonryPhoto({
  src,
  srcAvif,
  alt = "",
  width,
  height,
  placeholder,
  index = 0,
  onClick,
  className = "",
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const aspectRatio =
    width && height ? `${width} / ${height}` : "4 / 3";

  // Stagger delay: 40ms per item, max 400ms
  const staggerDelay = Math.min(index * 40, 400);

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
      style={{
        aspectRatio,
        opacity: 0,
        animation: inView
          ? `masonry-fade-in 0.5s ease-out ${staggerDelay}ms forwards`
          : "none",
      }}
    >
      {/* Blur placeholder — real base64 image or gradient fallback */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        style={
          placeholder
            ? {
                backgroundImage: `url(${placeholder})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(8px)",
                transform: "scale(1.1)",
              }
            : {
                background:
                  "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
              }
        }
      />

      {inView && (
        <button
          onClick={onClick}
          className="w-full h-full block"
          type="button"
        >
          <picture>
            {srcAvif && <source srcSet={srcAvif} type="image/avif" />}
            {src.endsWith(".webp") ? null : (
              <source srcSet={src.replace(/\.\w+$/, ".webp")} type="image/webp" />
            )}
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
          </picture>
        </button>
      )}
    </div>
  );
}
