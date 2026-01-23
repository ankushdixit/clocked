"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "./Sparkline";

export interface HeroMetricCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  sparklineData: number[];
  sparklineColor: string;
  highlight?: boolean;
}

export function HeroMetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  trendValue,
  sparklineData,
  sparklineColor,
  highlight,
}: HeroMetricCardProps) {
  const trendColors = {
    up: "text-emerald-600 bg-emerald-500/10",
    down: "text-red-600 bg-red-500/10",
    neutral: "text-muted-foreground bg-muted",
  };

  const TrendBadge = () => (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        trendColors[trend]
      )}
    >
      {trend === "up" && <TrendingUp className="w-3 h-3 flex-shrink-0" />}
      {trend === "down" && <TrendingDown className="w-3 h-3 flex-shrink-0" />}
      {trendValue}
    </span>
  );

  return (
    <div className="rounded-xl bg-muted/50 p-5 min-h-[140px] overflow-hidden">
      <div className="flex items-center h-full gap-4 min-w-0">
        {/* Left side: Icon, Title, Value - 2/3 below lg, full lg-xl, 2/3 xl+ */}
        <div className="w-2/3 lg:w-full xl:w-2/3 min-w-0">
          {/* Icon row with trend badge inline on right (only lg to xl) */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shadow-sm flex-shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            {/* Trend badge - inline with icon only between lg and xl */}
            <div className="hidden lg:flex xl:hidden items-center flex-shrink-0">
              <TrendBadge />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          <p
            className={cn(
              "text-3xl min-[768px]:text-2xl min-[896px]:text-3xl lg:text-2xl 2xl:text-3xl font-bold mt-1 truncate",
              highlight && "text-emerald-500"
            )}
          >
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        </div>

        {/* Right side: Sparkline + Trend badge - visible below lg and xl+, hidden lg-xl */}
        <div className="flex lg:hidden xl:flex w-1/3 flex-col items-end justify-center gap-2 min-w-0">
          {/* Sparkline */}
          <div className="w-full h-16 min-w-0">
            <Sparkline data={sparklineData} color={sparklineColor} />
          </div>
          {/* Trend badge */}
          <div className="flex items-center flex-shrink-0">
            <TrendBadge />
          </div>
        </div>
      </div>
    </div>
  );
}
