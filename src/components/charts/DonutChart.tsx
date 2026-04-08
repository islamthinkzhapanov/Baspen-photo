"use client";

import { resolveColors } from "@/lib/chart-colors";

interface DonutChartProps {
  data: Record<string, unknown>[];
  index: string;
  category: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
  showLegend?: boolean;
  label?: string;
}

const SIZE = 140;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  data,
  index,
  category,
  colors: colorNames = ["blue", "sky"],
  valueFormatter,
  className,
  showLegend = true,
  label,
}: DonutChartProps) {
  const hex = resolveColors(colorNames);
  const total = data.reduce((s, d) => s + (d[category] as number), 0);

  // Primary segment for center label
  const primaryValue = data.length > 0 ? (data[0][category] as number) : 0;
  const primaryName = data.length > 0 ? (data[0][index] as string) : "";
  const centerLabel =
    label ?? (valueFormatter ? valueFormatter(primaryValue) : String(primaryValue));

  // Build arc segments
  const segments = data.reduce<{ dash: number; gap: number; offset: number; color: string }[]>((acc, d, i) => {
    const value = d[category] as number;
    const pct = total > 0 ? value / total : 0;
    const dash = pct * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const currentOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    acc.push({ dash, gap, offset: currentOffset, color: hex[i % hex.length] });
    return acc;
  }, []);

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-5">
        {/* SVG Donut */}
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            className="block -rotate-90"
          >
            {/* Background track */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth={STROKE}
            />
            {/* Segments */}
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="round"
              />
            ))}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-text leading-none">
              {centerLabel}
            </span>
            <span className="text-xs text-text-secondary mt-1">
              {primaryName}
            </span>
          </div>
        </div>

        {/* Inline legend */}
        {showLegend && (
          <div className="flex items-center gap-8 mt-auto pt-2">
            {data.map((d, i) => {
              const value = d[category] as number;
              const name = d[index] as string;
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              const color = hex[i % hex.length];
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-text-secondary">
                    {name}
                  </span>
                  <span className="text-xs font-semibold text-text">
                    {valueFormatter ? valueFormatter(value) : `${pct}%`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
