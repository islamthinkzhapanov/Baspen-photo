"use client";

interface ProtectedImageProps {
  src: string | undefined;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto";
  onLoad?: () => void;
  onClick?: () => void;
}

/**
 * Image component with download protection (defense-in-depth).
 * The real protection is the server-side watermark — this prevents casual
 * right-click / drag / long-press saves on the frontend.
 */
export function ProtectedImage({
  src,
  alt = "",
  className,
  wrapperClassName,
  style,
  loading,
  decoding,
  onLoad,
  onClick,
}: ProtectedImageProps) {
  return (
    <div className={`protected-image ${wrapperClassName || "relative"}`} style={style} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        draggable={false}
        onLoad={onLoad}
        onDragStart={(e) => e.preventDefault()}
      />
      {/* Transparent overlay to intercept right-click and drag */}
      <div
        className="absolute inset-0 z-[1]"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
