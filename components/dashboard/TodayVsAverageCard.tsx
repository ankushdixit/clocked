"use client";

import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/formatters/time";
import { formatCost } from "@/lib/calculators/usage-calculator";
import { generateDailyComparison } from "@/lib/mockData";

export function TodayVsAverageCard() {
  const comparison = generateDailyComparison();

  const metrics = [
    {
      label: "Sessions",
      today: comparison.today.sessions,
      average: comparison.average.sessions,
      format: (v: number) => v.toFixed(1).replace(/\.0$/, ""),
      gradient: "linear-gradient(90deg, #10b981, #14b8a6)",
    },
    {
      label: "Time",
      today: comparison.today.time,
      average: comparison.average.time,
      format: (v: number) => formatDuration(v),
      gradient: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
    },
    {
      label: "Cost",
      today: comparison.today.cost,
      average: comparison.average.cost,
      format: (v: number) => formatCost(v),
      gradient: "linear-gradient(90deg, #f59e0b, #f97316)",
    },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today vs Daily Average
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center space-y-5">
        {metrics.map((metric) => {
          const percentage = metric.average > 0 ? (metric.today / metric.average) * 100 : 0;

          return (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{metric.format(metric.today)}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">{metric.format(metric.average)}</span>
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all shadow-sm"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    background: metric.gradient,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {percentage.toFixed(0)}% of daily average
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
