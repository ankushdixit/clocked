"use client";

import { useMemo, useState } from "react";
import { eachDayOfInterval, startOfMonth, endOfMonth, format, getDay, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/formatters/time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import type { DailyActivity } from "@/types/electron";

export interface ActivityHeatmapProps {
  dailyActivity: DailyActivity[];
  month?: Date;
}

/**
 * Color intensity levels for the heatmap (GitHub-style)
 * Progression: light → dark for more activity (6 levels + gray)
 */
const INTENSITY_LEVELS = [
  "bg-slate-100", // 0 sessions - light gray (no activity / future days)
  "bg-emerald-200", // level 1 - lightest green
  "bg-emerald-300", // level 2
  "bg-emerald-400", // level 3
  "bg-emerald-500", // level 4
  "bg-emerald-600", // level 5
  "bg-emerald-700", // level 6 - darkest green
];

/**
 * Get intensity level based on relative position in the data range
 * @param count - session count for this day
 * @param maxCount - maximum session count in the dataset
 */
function getIntensityLevel(count: number, maxCount: number): string {
  if (count === 0) return INTENSITY_LEVELS[0];
  if (maxCount === 0) return INTENSITY_LEVELS[0];

  // Calculate which sixth this count falls into (6 levels)
  const ratio = count / maxCount;

  if (ratio <= 1 / 6) return INTENSITY_LEVELS[1];
  if (ratio <= 2 / 6) return INTENSITY_LEVELS[2];
  if (ratio <= 3 / 6) return INTENSITY_LEVELS[3];
  if (ratio <= 4 / 6) return INTENSITY_LEVELS[4];
  if (ratio <= 5 / 6) return INTENSITY_LEVELS[5];
  return INTENSITY_LEVELS[6];
}

interface TooltipData {
  date: string;
  sessionCount: number;
  totalTime: number;
  x: number;
  y: number;
}

export function ActivityHeatmap({ dailyActivity, month = new Date() }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Create a map for quick lookup of activity by date
  const activityMap = useMemo(() => {
    const map = new Map<string, DailyActivity>();
    dailyActivity.forEach((activity) => {
      map.set(activity.date, activity);
    });
    return map;
  }, [dailyActivity]);

  // Calculate max session count for relative intensity
  const maxSessionCount = useMemo(() => {
    if (dailyActivity.length === 0) return 0;
    return Math.max(...dailyActivity.map((a) => a.sessionCount));
  }, [dailyActivity]);

  // Get all days in the month
  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [month]);

  // Group days by week (0 = Sunday, 6 = Saturday)
  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    const firstDayOfWeek = getDay(days[0]);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days to last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      result.push(currentWeek);
    }

    return result;
  }, [days]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dateStr = format(day, "yyyy-MM-dd");
    const activity = activityMap.get(dateStr);

    setTooltip({
      date: format(day, "MMM d, yyyy"),
      sessionCount: activity?.sessionCount ?? 0,
      totalTime: activity?.totalTime ?? 0,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center @container px-1">
        <div className="relative inline-flex flex-col">
          {/* Day labels - width responsive to container, height fixed */}
          <div className="flex gap-0.5 @[200px]:gap-1 mb-1">
            {dayNames.map((name) => (
              <div
                key={name}
                className="w-4 @[180px]:w-5 @[220px]:w-6 h-4 text-[10px] text-muted-foreground text-center"
              >
                {name[0]}
              </div>
            ))}
          </div>

          {/* Weeks grid - width responsive to container, height fixed */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-0.5 @[200px]:gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${dayIndex}`}
                        className="w-4 @[180px]:w-5 @[220px]:w-6 h-6"
                      />
                    );
                  }

                  const dateStr = format(day, "yyyy-MM-dd");
                  const activity = activityMap.get(dateStr);
                  const sessionCount = activity?.sessionCount ?? 0;
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "w-4 @[180px]:w-5 @[220px]:w-6 h-6 rounded-sm cursor-pointer transition-colors",
                        getIntensityLevel(sessionCount, maxSessionCount),
                        isToday && "ring-1 ring-foreground ring-offset-1 ring-offset-background"
                      )}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend - aligned with grid width */}
          <div className="flex items-center justify-between mt-4 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-0.5">
              {INTENSITY_LEVELS.map((level, i) => (
                <div key={i} className={cn("w-2 h-2 rounded-sm flex-shrink-0", level)} />
              ))}
            </div>
            <span>More</span>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-md border pointer-events-none"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="font-medium">{tooltip.date}</div>
              <div className="text-muted-foreground">
                {tooltip.sessionCount} {tooltip.sessionCount === 1 ? "session" : "sessions"}
                {tooltip.totalTime > 0 && `, ${formatDuration(tooltip.totalTime)}`}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
