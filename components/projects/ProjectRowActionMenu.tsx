"use client";

/**
 * Project row action menu component
 * Dropdown menu with actions: merged projects, move to group, hide/show
 */

import { Button } from "@/components/ui/button";
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
import {
  MoreHorizontal,
  GitMerge,
  Unlink,
  FolderPlus,
  FolderMinus,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Project, ProjectGroup } from "@/types/electron";

interface ProjectRowActionMenuProps {
  project: Project;
  groups: ProjectGroup[];
  mergedProjects?: Project[];
  onSetHidden: (project: Project, hidden: boolean) => void;
  onSetGroup: (project: Project, groupId: string | null) => void;
  onUnmerge: (path: string) => void;
}

export function ProjectRowActionMenu({
  project,
  groups,
  mergedProjects,
  onSetHidden,
  onSetGroup,
  onUnmerge,
}: ProjectRowActionMenuProps) {
  const hasMergedProjects = mergedProjects && mergedProjects.length > 0;

  return (
    <div onClick={(e) => e.stopPropagation()} className="order-2 lg:order-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasMergedProjects && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <GitMerge className="mr-2 h-4 w-4" />
                  Merged directories ({mergedProjects.length})
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {mergedProjects.map((merged) => (
                    <DropdownMenuItem key={merged.path} onClick={() => onUnmerge(merged.path)}>
                      <Unlink className="mr-2 h-4 w-4" />
                      <span className="truncate max-w-[200px]" title={merged.path}>
                        {merged.name}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
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
    </div>
  );
}
