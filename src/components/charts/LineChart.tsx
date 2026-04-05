"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { resolveColors } from "@/lib/chart-colors";
import { ChartTooltip } from "./ChartTooltip";

interface LineChartProps {
  data: Record<string, unknown>[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
  showLegend?: boolean;
  yAxisWidth?: number;
}

const HEIGHT_MAP: Record<string, number> = {
  "h-44": 176,
  "h-56": 224,
  "h-60": 240,
  "h-64": 256,
  "h-32": 128,
};

function parseHeight(className?: string): number {
  if (!className) return 256;
  for (const [cls, px] of Object.entries(HEIGHT_MAP)) {
    if (className.includes(cls)) return px;
  }
  return 256;
}

export function LineChart({
  data,
  index,
  categories,
  colors: colorNames = ["blue"],
  valueFormatter,
  className,
  showLegend = true,
  yAxisWidth = 56,
}: LineChartProps) {
  const hex = resolveColors(colorNames);
  const height = parseHeight(className);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          {hex.map((color, i) => (
            <linearGradient key={i} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey={index}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          width={yAxisWidth}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={valueFormatter as ((value: number) => string) | undefined}
        />
        <Tooltip
          content={<ChartTooltip colors={hex} valueFormatter={valueFormatter} />}
        />
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "#6b7280" }}
          />
        )}
        {categories.map((cat, i) => (
          <Area
            key={cat}
            type="linear"
            dataKey={cat}
            stroke={hex[i % hex.length]}
            strokeWidth={2}
            fill={`url(#gradient-${i % hex.length})`}
            dot={false}
            activeDot={{ r: 4, fill: hex[i % hex.length], strokeWidth: 2, stroke: "#fff" }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
