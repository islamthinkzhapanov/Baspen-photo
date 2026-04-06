/** Color name → hex map for charts. Hex values bypass CSS variables, fixing Safari SVG fill/stroke. */
export const chartColorMap: Record<string, string> = {
  blue: "#005FF9",
  sky: "#5EB3F9",
  green: "#22c55e",
  cyan: "#06b6d4",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  purple: "#a855f7",
  pink: "#ec4899",
  orange: "#f97316",
  yellow: "#eab308",
  gray: "#6b7280",
};

export function resolveColors(names: string[]): string[] {
  return names.map((n) => chartColorMap[n] || n);
}
