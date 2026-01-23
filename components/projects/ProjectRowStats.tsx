"use client";

/**
 * Project row stats component
 * Displays sparkline and project statistics (sessions, time, last activity)
 */

import { formatDuration, formatLastActivity } from "@/lib/formatters/time";
import { generateActivityData } from "@/lib/projects/activity";
import type { Project } from "@/types/electron";

interface ProjectRowStatsProps {
  project: Project;
  accentColor?: string | null;
}

export function ProjectRowStats({ project, accentColor }: ProjectRowStatsProps) {
  const activity = generateActivityData(project);
  const maxActivity = Math.max(...activity, 1);
  const sparklineColor = accentColor || "#3b82f6";

  return (
    <div className="flex items-center text-sm tabular-nums order-3 lg:order-2 w-full lg:w-auto">
      {/* 7-day activity sparkline */}
      <div className="w-[50px] flex justify-end" title="Last 7 days activity">
        <div className="flex items-end gap-[2px] h-4 w-[38px]">
          {activity.map((value, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${Math.max(15, (value / maxActivity) * 100)}%`,
                backgroundColor: sparklineColor,
                opacity: value > 0 ? 0.3 + (value / maxActivity) * 0.5 : 0.15,
              }}
            />
          ))}
        </div>
      </div>

      <div className="w-[90px] text-right">
        <span className="font-medium">{project.sessionCount}</span>
        <span className="text-muted-foreground ml-1 text-xs">sessions</span>
      </div>
      <div className="w-[85px] text-right">
        <span className="font-medium">{formatDuration(project.totalTime)}</span>
      </div>
      <div className="w-[70px] text-right text-muted-foreground text-xs">
        {formatLastActivity(project.lastActivity)}
      </div>
    </div>
  );
}
