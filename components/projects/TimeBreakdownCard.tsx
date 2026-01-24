"use client";

/**
 * Time Breakdown Card
 *
 * Displays cascading horizontal bars showing time metrics from largest to smallest:
 * 1. Clock Time - Wall clock span from first session to last activity (100% width)
 * 2. Session Time - Total logged session time (proportional width)
 * 3. Active Time - Actual work time after inactivity filtering (proportional width)
 * 4. Human + AI Split - Breakdown of the active time (split bar)
 */

import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/formatters/time";

interface TimeBreakdownCardProps {
  /** Wall clock start timestamp */
  clockStart: string;
  /** Wall clock end timestamp */
  clockEnd: string;
  /** Raw session time in milliseconds (without inactivity filtering) */
  rawSessionTime: number;
  /** Filtered session time in milliseconds (with inactivity removed) */
  filteredSessionTime: number;
  /** Human time in milliseconds */
  humanTime: number;
  /** AI/Claude time in milliseconds */
  aiTime: number;
}

/** Format clock time span as readable string */
function formatClockSpan(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();

  // If less than 24 hours, show hours
  if (diffMs < 24 * 60 * 60 * 1000) {
    return formatDuration(diffMs);
  }

  // Otherwise show days
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `${days} day${days !== 1 ? "s" : ""}`;
}

/** Single time layer bar - center aligned for funnel effect, text inside */
function TimeBar({
  label,
  value,
  widthPercent,
  gradient,
}: {
  label: string;
  value: string;
  widthPercent: number;
  gradient: string;
}) {
  return (
    <div className="flex justify-center">
      <div
        className="h-8 rounded-md transition-all flex items-center justify-between px-3"
        style={{
          width: `${Math.max(widthPercent, 2)}%`,
          background: gradient,
        }}
      >
        <span className="text-white text-xs font-medium drop-shadow-sm">{label}</span>
        <span className="text-white text-sm font-bold drop-shadow-sm">{value}</span>
      </div>
    </div>
  );
}

/** Split bar for human vs AI time - center aligned for funnel effect, text inside */
function SplitBar({
  humanTime,
  aiTime,
  humanPercent,
  claudePercent,
  widthPercent,
}: {
  humanTime: string;
  aiTime: string;
  humanPercent: number;
  claudePercent: number;
  widthPercent: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-center">
        <div
          className="h-8 flex rounded-md overflow-hidden"
          style={{ width: `${Math.max(widthPercent, 2)}%` }}
        >
          <div
            className="h-full transition-all flex items-center justify-center px-2"
            style={{
              width: `${humanPercent}%`,
              background: "linear-gradient(90deg, #10b981, #14b8a6)",
            }}
          >
            <span className="text-white text-xs font-bold drop-shadow-sm truncate">
              {humanTime}
            </span>
          </div>
          <div
            className="h-full transition-all flex items-center justify-center px-2"
            style={{
              width: `${claudePercent}%`,
              background: "linear-gradient(90deg, #ec4899, #f43f5e)",
            }}
          >
            <span className="text-white text-xs font-bold drop-shadow-sm truncate">{aiTime}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Human {humanPercent}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-pink-500" />
          <span>Claude {claudePercent}%</span>
        </div>
      </div>
    </div>
  );
}

export function TimeBreakdownCard({
  clockStart,
  clockEnd,
  rawSessionTime,
  filteredSessionTime,
  humanTime,
  aiTime,
}: TimeBreakdownCardProps) {
  // Calculate human vs AI percentages
  const total = humanTime + aiTime;
  const humanPercent = total > 0 ? Math.round((humanTime / total) * 100) : 50;
  const claudePercent = total > 0 ? Math.round((aiTime / total) * 100) : 50;

  // Fixed progressive widths for funnel effect (not proportional to actual values)
  const FUNNEL_WIDTHS = {
    clock: 100,
    session: 85,
    active: 70,
    split: 55,
  };

  return (
    <Card data-testid="time-breakdown-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Time Breakdown</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        <TimeBar
          label="Clock Time"
          value={formatClockSpan(clockStart, clockEnd)}
          widthPercent={FUNNEL_WIDTHS.clock}
          gradient="linear-gradient(90deg, #64748b, #475569)"
        />
        <TimeBar
          label="Session Time"
          value={formatDuration(rawSessionTime)}
          widthPercent={FUNNEL_WIDTHS.session}
          gradient="linear-gradient(90deg, #3b82f6, #8b5cf6)"
        />
        <TimeBar
          label="Active Time"
          value={formatDuration(filteredSessionTime)}
          widthPercent={FUNNEL_WIDTHS.active}
          gradient="linear-gradient(90deg, #f59e0b, #f97316)"
        />
        <SplitBar
          humanTime={formatDuration(humanTime)}
          aiTime={formatDuration(aiTime)}
          humanPercent={humanPercent}
          claudePercent={claudePercent}
          widthPercent={FUNNEL_WIDTHS.split}
        />
      </CardContent>
    </Card>
  );
}
