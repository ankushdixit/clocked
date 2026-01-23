"use client";

import { cn } from "@/lib/utils";

export interface UsageMeterProps {
  percentage: number;
  daysRemaining: number;
}

export function UsageMeter({ percentage, daysRemaining }: UsageMeterProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden"
            style={{ width: "300px" }}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                clampedPercentage >= 90
                  ? "bg-red-500"
                  : clampedPercentage >= 70
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
              )}
              style={{ width: `${clampedPercentage}%` }}
            />
          </div>
          <span className="text-muted-foreground font-medium">
            {Math.round(clampedPercentage)}%
          </span>
        </div>
        <span className="text-muted-foreground">
          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
        </span>
      </div>
    </div>
  );
}
