"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
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

const HEIGHT_MAP: Record<string, number> = {
  "h-40": 160,
  "h-44": 176,
  "h-56": 224,
  "h-60": 240,
  "h-64": 256,
};

function parseHeight(className?: string): number {
  if (!className) return 176;
  for (const [cls, px] of Object.entries(HEIGHT_MAP)) {
    if (className.includes(cls)) return px;
  }
  return 176;
}

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
  const height = parseHeight(className);

  // Calculate the primary value for center label
  const primaryValue = data.length > 0 ? (data[0][category] as number) : 0;
  const primaryName = data.length > 0 ? (data[0][index] as string) : "";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={category}
          nameKey={index}
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="82%"
          paddingAngle={3}
          strokeWidth={0}
          cornerRadius={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={hex[i % hex.length]} />
          ))}
        </Pie>

        {/* Center label */}
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-text"
          style={{ fontSize: 20, fontWeight: 700 }}
        >
          {label ?? (valueFormatter ? valueFormatter(primaryValue) : primaryValue)}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-text-secondary"
          style={{ fontSize: 11 }}
        >
          {primaryName}
        </text>

        <Tooltip
          formatter={(value: number) =>
            valueFormatter ? valueFormatter(value) : value
          }
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 12,
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          }}
        />
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "#6b7280" }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
