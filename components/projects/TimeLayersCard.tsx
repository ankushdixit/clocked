"use client";

/**
 * Time Layers Card Component
 *
 * Displays time breakdown for a project:
 * - Wall clock time range (first to last activity)
 * - Session time (total duration)
 * - Active time, Human time, Claude time (placeholders until Story 2.1)
 */

import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/formatters/time";

interface TimeLayersCardProps {
  wallClockStart: string;
  wallClockEnd: string;
  sessionTime: number;
  activeTime: number | null;
  humanTime: number | null;
  claudeTime: number | null;
}

/** Format date to short locale string */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Row component for displaying a time metric */
function TimeRow({
  label,
  value,
  indent = false,
}: {
  label: string;
  value: string;
  indent?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center ${indent ? "ml-4" : ""}`}>
      <span className="text-muted-foreground text-sm">
        {indent && <span className="mr-1">└</span>}
        {label}
      </span>
      <span className="font-medium text-sm tabular-nums">{value}</span>
    </div>
  );
}

export function TimeLayersCard({
  wallClockStart,
  wallClockEnd,
  sessionTime,
  activeTime,
  humanTime,
  claudeTime,
}: TimeLayersCardProps) {
  const wallClockLabel = `${formatDate(wallClockStart)} → ${formatDate(wallClockEnd)}`;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Time Layers</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center space-y-1.5">
        <TimeRow label="Wall Clock" value={wallClockLabel} />
        <TimeRow label="Session Time" value={formatDuration(sessionTime)} />
        <TimeRow
          label="Active Time"
          value={activeTime !== null ? formatDuration(activeTime) : "—"}
        />
        <TimeRow
          label="Human"
          value={humanTime !== null ? formatDuration(humanTime) : "—"}
          indent
        />
        <TimeRow
          label="Claude"
          value={claudeTime !== null ? formatDuration(claudeTime) : "—"}
          indent
        />
      </CardContent>
    </Card>
  );
}
