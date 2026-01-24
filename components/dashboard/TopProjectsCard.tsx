"use client";

import Link from "next/link";
import { Zap, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/formatters/time";
import { formatCost } from "@/lib/calculators/usage-calculator";
import { generateEnhancedProjects } from "@/lib/mockData";
import type { Project } from "@/types/electron";

// Project colors for visual distinction
const PROJECT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
];

interface TopProjectsCardProps {
  projects?: Project[];
}

export function TopProjectsCard({ projects: realProjects }: TopProjectsCardProps) {
  // Use real projects if available, otherwise fall back to mock data
  const mockProjects = generateEnhancedProjects();

  // Transform real projects to match the display format
  // Estimate cost: ~$0.50 per hour of session time (rough approximation)
  const estimateCost = (totalTimeMs: number) => (totalTimeMs / (1000 * 60 * 60)) * 0.5;

  const projects =
    realProjects && realProjects.length > 0
      ? realProjects
          .filter((p) => !p.mergedInto) // Exclude merged projects
          .sort((a, b) => b.totalTime - a.totalTime) // Sort by total time
          .slice(0, 5)
          .map((p, index) => ({
            name: p.name,
            path: p.path,
            sessionCount: p.sessionCount,
            totalTime: p.totalTime,
            estimatedCost: estimateCost(p.totalTime),
            weeklyTrend: [3, 5, 2, 7, 4, 6, 3], // Mock weekly trend for now
            color: PROJECT_COLORS[index % PROJECT_COLORS.length],
          }))
      : mockProjects;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Top Projects</span>
          </CardTitle>
          <Link
            href="/projects"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 overflow-hidden">
        {projects.slice(0, 5).map((project, index) => {
          const maxWeekly = Math.max(...project.weeklyTrend);

          return (
            <Link
              key={project.path}
              href={`/projects/${encodeURIComponent(project.path)}`}
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
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
