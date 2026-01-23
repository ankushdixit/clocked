"use client";

import { Zap, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/formatters/time";
import { formatCost } from "@/lib/calculators/usage-calculator";
import { generateEnhancedProjects } from "@/lib/mockData";

export function TopProjectsCard() {
  const projects = generateEnhancedProjects();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Top Projects</span>
          </CardTitle>
          <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 flex-shrink-0">
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 overflow-hidden">
        {projects.slice(0, 5).map((project, index) => {
          const maxWeekly = Math.max(...project.weeklyTrend);

          return (
            <div
              key={project.path}
              className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              {/* Rank */}
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: project.color }}
              >
                {index + 1}
              </div>

              {/* Project info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {project.sessionCount} sessions · {formatDuration(project.totalTime)}
                </p>
              </div>

              {/* Weekly mini chart */}
              <div className="flex items-end gap-0.5 h-5 w-12 flex-shrink-0">
                {project.weeklyTrend.map((count, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${Math.max(20, (count / maxWeekly) * 100)}%`,
                      backgroundColor: project.color,
                      opacity: 0.4 + (count / maxWeekly) * 0.6,
                    }}
                  />
                ))}
              </div>

              {/* Cost */}
              <p className="font-medium text-sm w-16 text-right flex-shrink-0">
                {formatCost(project.estimatedCost)}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
