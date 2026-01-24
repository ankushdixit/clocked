"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { generateHourlyDistribution } from "@/lib/mockData";

interface TooltipData {
  hour: number;
  sessions: number;
  x: number;
  y: number;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function HourTooltip({ tooltip }: { tooltip: TooltipData }) {
  return (
    <div
      className="fixed z-50 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-md border pointer-events-none"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="font-medium">
        {formatHour(tooltip.hour)} - {formatHour((tooltip.hour + 1) % 24)}
      </div>
      <div className="text-muted-foreground">
        {tooltip.sessions} {tooltip.sessions === 1 ? "session" : "sessions"}
      </div>
    </div>
  );
}

export function HourlyDistributionCard() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const hourlyData = generateHourlyDistribution();
  const maxSessions = Math.max(...hourlyData.map((h) => h.sessions));
  const peakHour = hourlyData.find((h) => h.sessions === maxSessions)?.hour ?? 0;

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    hour: number,
    sessions: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      hour,
      sessions,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Session Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end overflow-hidden">
        <p className="text-xs text-muted-foreground mb-2 text-center">
          Peak at <span className="font-medium text-foreground">{peakHour}:00</span>
        </p>
        <div className="flex items-end gap-0.5 h-32">
          {hourlyData.map(({ hour, sessions }) => {
            const heightPercent = maxSessions > 0 ? (sessions / maxSessions) * 100 : 0;
            const isPeakHour = sessions === maxSessions;

            return (
              <div
                key={hour}
                className="flex-1 h-full flex items-end cursor-pointer"
                onMouseEnter={(e) => handleMouseEnter(e, hour, sessions)}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-all hover:opacity-80",
                    isPeakHour ? "bg-emerald-500" : "bg-emerald-500/40"
                  )}
                  style={{
                    height: sessions > 0 ? `${heightPercent}%` : "0",
                    minHeight: sessions > 0 ? "2px" : "0",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>12am</span>
        </div>
        {tooltip && <HourTooltip tooltip={tooltip} />}
      </CardContent>
    </Card>
  );
}
