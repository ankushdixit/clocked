"use client";

/**
 * Project Quick Stats Card
 *
 * Displays 4 quick stats for a project in a 2x2 grid.
 * Design matches the dashboard QuickStatsCard pattern.
 */

import { Wrench, Flame, Timer, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { formatDuration } from "@/lib/formatters/time";

interface ProjectQuickStatsCardProps {
  /** Total tool calls count */
  toolCalls: number;
  /** Busiest day info */
  busiestDay: {
    date: string;
    sessions: number;
  };
  /** Longest session info */
  longestSession: {
    duration: number;
    date: string;
  };
  /** Average session duration in ms */
  avgSessionDuration: number;
}

export function ProjectQuickStatsCard({
  toolCalls,
  busiestDay,
  longestSession,
  avgSessionDuration,
}: ProjectQuickStatsCardProps) {
  const statItems = [
    {
      icon: Wrench,
      label: "Tool Calls",
      value: toolCalls.toLocaleString(),
      subvalue: "total",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      icon: Flame,
      label: "Busiest Day",
      value: busiestDay.date,
      subvalue: `${busiestDay.sessions} sessions`,
      color: "bg-rose-500/10 text-rose-500",
    },
    {
      icon: Timer,
      label: "Longest Session",
      value: formatDuration(longestSession.duration),
      subvalue: longestSession.date,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: Clock,
      label: "Avg Duration",
      value: formatDuration(avgSessionDuration),
      subvalue: "per session",
      color: "bg-purple-500/10 text-purple-500",
    },
  ];

  return (
    <Card className="h-full flex flex-col overflow-hidden" data-testid="quick-stats-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Quick Stats</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 gap-2 h-full">
          {statItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                "p-3 rounded-lg flex flex-col justify-center min-w-0 overflow-hidden",
                item.color.split(" ")[0]
              )}
            >
              <item.icon className={cn("w-4 h-4 mb-1 flex-shrink-0", item.color.split(" ")[1])} />
              <p className="text-[11px] text-foreground/70 truncate">{item.label}</p>
              <p className="text-base font-bold truncate">{item.value}</p>
              <p className="text-[11px] text-foreground/70 truncate">{item.subvalue}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
