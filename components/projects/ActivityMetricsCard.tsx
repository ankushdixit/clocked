"use client";

/**
 * Activity Metrics Card Component
 *
 * Displays activity metrics for a project:
 * - Session count
 * - Message count
 * - Tool calls (placeholder until Story 2.2)
 * - Average session duration
 * - Average messages per session
 */

import { Activity, MessageSquare, Wrench, Timer, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/formatters/time";

interface ActivityMetricsCardProps {
  sessionCount: number;
  messageCount: number;
  toolCalls: number | null;
  avgSessionDuration: number;
  avgMessagesPerSession: number;
}

/** Metric row component with icon */
function MetricRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-md bg-muted/50">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-sm tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function ActivityMetricsCard({
  sessionCount,
  messageCount,
  toolCalls,
  avgSessionDuration,
  avgMessagesPerSession,
}: ActivityMetricsCardProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Activity Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-3 h-full">
          <MetricRow icon={Hash} label="Sessions" value={sessionCount.toLocaleString()} />
          <MetricRow icon={MessageSquare} label="Messages" value={messageCount.toLocaleString()} />
          <MetricRow
            icon={Wrench}
            label="Tool Calls"
            value={toolCalls !== null ? toolCalls.toLocaleString() : "—"}
          />
          <MetricRow icon={Timer} label="Avg Session" value={formatDuration(avgSessionDuration)} />
          <MetricRow
            icon={MessageSquare}
            label="Avg Messages"
            value={`${Math.round(avgMessagesPerSession)}/session`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
