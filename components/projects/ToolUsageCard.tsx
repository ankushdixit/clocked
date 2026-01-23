"use client";

/**
 * Tool Usage Card Component
 *
 * Displays horizontal bar chart of tool usage sorted by count.
 * Shows placeholder data until Story 2.2 is implemented.
 */

import { Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ToolUsage {
  name: string;
  count: number;
}

interface ToolUsageCardProps {
  toolUsage: ToolUsage[] | null;
}

export function ToolUsageCard({ toolUsage }: ToolUsageCardProps) {
  const hasData = toolUsage !== null && toolUsage.length > 0;
  const maxCount = hasData ? Math.max(...toolUsage.map((t) => t.count)) : 0;

  // Tool colors for visual distinction
  const toolColors: Record<string, string> = {
    Bash: "bg-amber-500",
    Edit: "bg-blue-500",
    Read: "bg-emerald-500",
    Write: "bg-purple-500",
    Glob: "bg-pink-500",
    Grep: "bg-cyan-500",
    Task: "bg-orange-500",
  };

  const getBarColor = (toolName: string): string => {
    return toolColors[toolName] || "bg-slate-500";
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wrench className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Tool Usage</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {hasData ? (
          <div className="space-y-2">
            {toolUsage.map((tool) => {
              const widthPercent = maxCount > 0 ? (tool.count / maxCount) * 100 : 0;
              return (
                <div key={tool.name} className="flex items-center gap-3">
                  <span className="w-12 text-xs text-muted-foreground truncate">{tool.name}</span>
                  <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
                    <div
                      className={`h-full ${getBarColor(tool.name)} transition-all`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <span className="w-14 text-xs text-right tabular-nums text-muted-foreground">
                    {tool.count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground text-sm">
            <div>
              <p className="text-2xl font-medium mb-1">—</p>
              <p className="text-xs">Available in future update</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
