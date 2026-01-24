"use client";

/**
 * Human vs AI Time Card Component
 *
 * Displays a visual comparison of human vs AI (Claude) time.
 * Shows placeholder data until Story 2.1 is implemented.
 */

import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/formatters/time";

interface HumanVsAICardProps {
  humanTime: number | null;
  claudeTime: number | null;
}

export function HumanVsAICard({ humanTime, claudeTime }: HumanVsAICardProps) {
  const hasData = humanTime !== null && claudeTime !== null;
  const total = hasData ? humanTime + claudeTime : 0;
  const humanPercent = hasData && total > 0 ? Math.round((humanTime / total) * 100) : 0;
  const aiPercent = hasData ? 100 - humanPercent : 0;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Human vs AI Time</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        {hasData ? (
          <>
            {/* Progress bar */}
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${humanPercent}%` }}
              />
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${aiPercent}%` }}
              />
            </div>

            {/* Labels */}
            <div className="flex justify-between mt-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Human</span>
                <span className="font-medium">{humanPercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">AI</span>
                <span className="font-medium">{aiPercent}%</span>
              </div>
            </div>

            {/* Absolute times */}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatDuration(humanTime)}</span>
              <span>{formatDuration(claudeTime)}</span>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground text-sm">
            <p className="text-2xl font-medium mb-1">—</p>
            <p className="text-xs">Available in future update</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
