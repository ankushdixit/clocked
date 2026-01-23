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
    <Card className="h-full flex flex-col overflow-hidden">
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
        <div className="space-y-2">
          {mergedProjects.map((project) => (
            <div
              key={project.path}
              className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <FolderOpen className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground truncate">{project.path}</p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{project.sessionCount} sessions</span>
                  <span>{formatDuration(project.totalTime)}</span>
                  <span>{project.messageCount} messages</span>
                </div>
              </div>
              {onUnmerge && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => onUnmerge(project.path)}
                  title="Unmerge this project"
                >
                  <Unlink className="w-3 h-3 mr-1" />
                  Unmerge
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
