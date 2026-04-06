"use client";

import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { resolveColors } from "@/lib/chart-colors";
import { ChartTooltip } from "./ChartTooltip";

interface BarChartProps {
  data: Record<string, unknown>[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
  showLegend?: boolean;
  stack?: boolean;
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

export function BarChart({
  data,
  index,
  categories,
  colors: colorNames = ["blue"],
  valueFormatter,
  className,
  showLegend = true,
  stack = false,
  yAxisWidth = 48,
}: BarChartProps) {
  const hex = resolveColors(colorNames);
  const height = parseHeight(className);
  const stackId = stack ? "stack" : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 16, 61, 0.08)" vertical={false} />
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
          cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
        />
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "#6b7280" }}
          />
        )}
        {categories.map((cat, i) => {
          const isLast = stack && i === categories.length - 1;
          return (
            <Bar
              key={cat}
              dataKey={cat}
              fill={hex[i % hex.length]}
              stackId={stackId}
              radius={isLast || !stack ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          );
        })}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
