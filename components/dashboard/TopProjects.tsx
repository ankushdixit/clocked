"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/formatters/time";
import { formatCost } from "@/lib/calculators/usage-calculator";
import type { ProjectSummary } from "@/types/electron";

export interface TopProjectsProps {
  projects: ProjectSummary[];
}

export function TopProjects({ projects }: TopProjectsProps) {
  // Find max time for percentage calculation
  const maxTime = projects.length > 0 ? Math.max(...projects.map((p) => p.totalTime)) : 0;

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No project activity this month</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.map((project) => {
          const percentage = maxTime > 0 ? (project.totalTime / maxTime) * 100 : 0;

          return (
            <Link
              key={project.path}
              href={`/projects/${encodeURIComponent(project.path)}`}
              className="block group"
            >
              <div className="flex items-center gap-3">
                {/* Project name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {project.sessionCount} {project.sessionCount === 1 ? "session" : "sessions"}
                    </span>
                    <span>{formatDuration(project.totalTime)}</span>
                    <span>{formatCost(project.estimatedCost)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
