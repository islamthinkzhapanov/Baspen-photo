"use client";

import type { TooltipProps } from "recharts";

interface Props extends TooltipProps<number, string> {
  colors: string[];
  valueFormatter?: (value: number) => string;
}

export function ChartTooltip({ active, payload, label, colors, valueFormatter }: Props) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-bg px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-text">{label}</p>
      {payload.map((entry, i) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="font-medium">
            {valueFormatter ? valueFormatter(entry.value as number) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
