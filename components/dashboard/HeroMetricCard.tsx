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
  /** Short version of trendValue for smaller screens (e.g., "+12% vs LW") */
  trendValueShort?: string;
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
  trendValueShort,
  sparklineData,
  sparklineColor,
  highlight,
}: HeroMetricCardProps) {
  const trendColors = {
    up: "text-emerald-600 bg-emerald-500/10",
    down: "text-red-600 bg-red-500/10",
    neutral: "text-muted-foreground bg-muted",
  };

  return (
    <div className="rounded-xl bg-muted/50 p-5 min-h-[140px] overflow-hidden">
      <div className="flex items-center h-full gap-4 min-w-0">
        {/* Left half: Icon, Title, Value */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shadow-sm flex-shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          <p className={cn("text-3xl font-bold mt-1 truncate", highlight && "text-emerald-500")}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        </div>

        {/* Right half: Sparkline + Trend badge */}
        <div className="flex-1 flex flex-col items-end justify-center gap-2 min-w-0">
          {/* Sparkline - hidden below xl to prevent overflow */}
          <div className="hidden xl:block w-full h-16 min-w-0">
            <Sparkline data={sparklineData} color={sparklineColor} />
          </div>

          {/* Trend badge - shows short text on smaller screens */}
          <div className="hidden md:flex items-center flex-shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                trendColors[trend]
              )}
            >
              {trend === "up" && <TrendingUp className="w-3 h-3 flex-shrink-0" />}
              {trend === "down" && <TrendingDown className="w-3 h-3 flex-shrink-0" />}
              {/* Show short version on lg screens, full on xl+ */}
              <span className="hidden xl:inline">{trendValue}</span>
              <span className="xl:hidden">{trendValueShort || trendValue}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
