"use client";

import { cn } from "@/lib/utils";

export interface SparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

export function Sparkline({ data, color = "currentColor", className }: SparklineProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 80 - 10; // 10-90 range for padding
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className={cn("w-full h-full", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={100}
        cy={100 - ((data[data.length - 1] - min) / range) * 80 - 10}
        r="3"
        fill={color}
      />
    </svg>
  );
}
