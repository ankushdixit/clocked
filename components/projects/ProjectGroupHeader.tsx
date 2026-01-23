"use client";

/**
 * Project group header component
 * Collapsible header for a group of projects
 */

import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import type { ProjectGroup } from "@/types/electron";

interface ProjectGroupHeaderProps {
  group: ProjectGroup | null;
  projectCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ProjectGroupHeader({
  group,
  projectCount,
  isCollapsed,
  onToggleCollapse,
}: ProjectGroupHeaderProps) {
  // Ungrouped header (non-collapsible)
  if (!group) {
    return (
      <div className="flex items-center gap-3 py-2">
        <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ungrouped
        </span>
        <span className="text-xs text-muted-foreground/60">{projectCount}</span>
        <div className="flex-1 h-px bg-border ml-2" />
      </div>
    );
  }

  // Regular group header (collapsible)
  return (
    <button onClick={onToggleCollapse} className="flex items-center gap-3 w-full py-2 group/header">
      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: group.color || "#6b7280" }} />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {group.name}
      </span>
      <span className="text-xs text-muted-foreground/60">{projectCount}</span>
      <div className="flex-1 h-px bg-border ml-2" />
      {isCollapsed ? (
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}
