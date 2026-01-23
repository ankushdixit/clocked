"use client";

import { format } from "date-fns";
import { Zap, Flame, Timer, Clock, MessageSquare, Activity, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/formatters/time";
import { formatCost } from "@/lib/calculators/usage-calculator";
import { generateQuickStats } from "@/lib/mockData";

export function QuickStatsCard() {
  const stats = generateQuickStats();

  const statItems = [
    {
      icon: Flame,
      label: "Busiest Day",
      value: format(new Date(stats.busiestDay.date), "MMM d"),
      subvalue: `${stats.busiestDay.sessions} sessions`,
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      icon: Timer,
      label: "Longest Session",
      value: formatDuration(stats.longestSession.duration),
      subvalue: stats.longestSession.project,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: Clock,
      label: "Peak Hour",
      value: `${stats.peakHour}:00`,
      subvalue: "most active",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: MessageSquare,
      label: "Messages",
      value: stats.totalMessages.toLocaleString(),
      subvalue: "this month",
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      icon: Activity,
      label: "Avg Session",
      value: formatDuration(stats.avgSessionLength),
      subvalue: "duration",
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      icon: DollarSign,
      label: "Cost/Session",
      value: formatCost(stats.avgCostPerSession),
      subvalue: "average",
      color: "bg-cyan-500/10 text-cyan-500",
    },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-3 grid-rows-2 gap-2 h-full">
          {statItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                "p-3 rounded-lg flex flex-col justify-center",
                item.color.split(" ")[0]
              )}
            >
              <item.icon className={cn("w-4 h-4 mb-1", item.color.split(" ")[1])} />
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
              <p className="text-base font-bold">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.subvalue}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
