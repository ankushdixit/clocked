"use client";

/**
 * Merged Projects Card Component
 *
 * Displays a list of projects that have been merged into the current project.
 * Allows users to unmerge individual projects.
 */

import { GitMerge, Unlink, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/formatters/time";
import type { Project } from "@/types/electron";

interface MergedProjectsCardProps {
  mergedProjects: Project[];
  onUnmerge?: (projectPath: string) => void;
}

export function MergedProjectsCard({ mergedProjects, onUnmerge }: MergedProjectsCardProps) {
  if (mergedProjects.length === 0) {
    return null;
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden" data-testid="merged-projects-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <GitMerge className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Merged Projects</span>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {mergedProjects.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}
        >
          {mergedProjects.map((project) => (
            <div key={project.path} className="relative p-3 rounded-lg border bg-muted/30">
              {onUnmerge && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={() => onUnmerge(project.path)}
                  title="Unmerge this project"
                >
                  <Unlink className="w-3 h-3 mr-1" />
                  Unmerge
                </Button>
              )}
              <div className="flex items-start gap-2">
                <FolderOpen className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0 pr-16">
                  <p className="font-medium text-sm truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{project.path}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span>{project.sessionCount} sessions</span>
                    <span>{formatDuration(project.totalTime)}</span>
                    <span>{project.messageCount} msgs</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
