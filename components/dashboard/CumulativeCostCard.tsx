"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCost } from "@/lib/calculators/usage-calculator";
import { generateCostTrend } from "@/lib/mockData";

export function CumulativeCostCard() {
  const costData = generateCostTrend();
  const maxCumulative = Math.max(...costData.map((d) => d.cumulative));
  const currentCost = costData[costData.length - 1]?.cumulative ?? 0;
  const dailyAvg = currentCost / costData.length;
  const lastDay = costData.length;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Cumulative Cost
          </CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              Current: <span className="font-bold text-foreground">{formatCost(currentCost)}</span>
            </span>
            <span className="text-muted-foreground">
              Avg: <span className="font-bold text-foreground">{formatCost(dailyAvg)}/day</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end overflow-hidden">
        {/* Chart with axes */}
        <div className="flex h-44 overflow-hidden">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-[10px] text-muted-foreground pr-2 w-14 text-right flex-shrink-0">
            <span>{formatCost(maxCumulative)}</span>
            <span>{formatCost(maxCumulative / 2)}</span>
            <span>$0</span>
          </div>

          {/* Chart area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid line */}
                <line
                  x1="0"
                  y1="50"
                  x2="100"
                  y2="50"
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="2"
                />
                <path
                  d={`M 0,100 ${costData
                    .map((d, i) => {
                      const x = (i / (costData.length - 1)) * 100;
                      const y = 100 - (d.cumulative / maxCumulative) * 100;
                      return `L ${x},${y}`;
                    })
                    .join(" ")} L 100,100 Z`}
                  fill="url(#costGradient)"
                />
                <polyline
                  points={costData
                    .map((d, i) => {
                      const x = (i / (costData.length - 1)) * 100;
                      const y = 100 - (d.cumulative / maxCumulative) * 100;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="rgb(16, 185, 129)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* X-axis labels (days of month) */}
            <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
              <span>Jan 1</span>
              <span>Jan {Math.round(lastDay / 2)}</span>
              <span>Jan {lastDay}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
