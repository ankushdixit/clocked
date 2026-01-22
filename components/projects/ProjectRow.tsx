"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/formatters/time";
import { MoreHorizontal, EyeOff, Eye, Star, FolderPlus, FolderMinus } from "lucide-react";
import type { Project, ProjectGroup } from "@/types/electron";

interface ProjectRowProps {
  project: Project;
  groups: ProjectGroup[];
  onClick: (project: Project) => void;
  onSetHidden: (project: Project, hidden: boolean) => void;
  onSetGroup: (project: Project, groupId: string | null) => void;
  onSetDefault: (project: Project) => void;
}

/**
 * Individual project row component for the projects list
 */
export function ProjectRow({
  project,
  groups,
  onClick,
  onSetHidden,
  onSetGroup,
  onSetDefault,
}: ProjectRowProps) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted" data-testid={`project-row-${project.path}`}>
      <TableCell onClick={() => onClick(project)}>
        <div className="flex items-center gap-2">
          {project.isDefault && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
          <div>
            <div className="font-medium">{project.name}</div>
            <div className="text-xs text-muted-foreground truncate max-w-md" title={project.path}>
              {project.path}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell onClick={() => onClick(project)}>{project.sessionCount}</TableCell>
      <TableCell onClick={() => onClick(project)}>{formatDuration(project.totalTime)}</TableCell>
      <TableCell onClick={() => onClick(project)}>
        {formatLastActivity(project.lastActivity)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!project.isDefault && (
              <DropdownMenuItem onClick={() => onSetDefault(project)}>
                <Star className="mr-2 h-4 w-4" />
                Set as default
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderPlus className="mr-2 h-4 w-4" />
                Move to group
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {project.groupId && (
                  <>
                    <DropdownMenuItem onClick={() => onSetGroup(project, null)}>
                      <FolderMinus className="mr-2 h-4 w-4" />
                      Remove from group
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {groups.length === 0 ? (
                  <DropdownMenuItem disabled>No groups available</DropdownMenuItem>
                ) : (
                  groups.map((group) => (
                    <DropdownMenuItem
                      key={group.id}
                      onClick={() => onSetGroup(project, group.id)}
                      disabled={project.groupId === group.id}
                    >
                      {group.color && (
                        <div
                          className="mr-2 h-3 w-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                      )}
                      {group.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSetHidden(project, !project.isHidden)}>
              {project.isHidden ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show project
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide project
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

/**
 * Format the last activity date for display
 */
function formatLastActivity(lastActivity: string): string {
  const date = new Date(lastActivity);
  return date.toLocaleDateString();
}
