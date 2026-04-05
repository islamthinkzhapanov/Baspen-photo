"use client";

import { cn } from "@/lib/utils";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}

export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#000000",
  className,
  children,
}: ShineBorderProps) {
  const colorStr = color instanceof Array ? color.join(",") : color;

  return (
    <div
      className={cn("shine-border-wrapper", className)}
      style={
        {
          "--sb-radius": `${borderRadius}px`,
          "--sb-width": `${borderWidth}px`,
          "--sb-duration": `${duration}s`,
          "--sb-gradient": `radial-gradient(transparent, transparent, ${colorStr}, transparent, transparent)`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
