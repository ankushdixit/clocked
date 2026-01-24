"use client";

/**
 * Project group header component
 * Collapsible header for a group of projects
 */

import { ChevronDown, ChevronRight, ChevronUp, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectGroup } from "@/types/electron";

interface ProjectGroupHeaderProps {
  group: ProjectGroup | null;
  projectCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ProjectGroupHeader({
  group,
  projectCount,
  isCollapsed,
  onToggleCollapse,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: ProjectGroupHeaderProps) {
  // Ungrouped header (non-collapsible, no reordering)
  if (!group) {
    return (
      <div className="flex items-center gap-3 py-2">
        <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ungrouped
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {projectCount}
        </span>
        <div className="flex-1 h-px bg-border ml-2" />
      </div>
    );
  }

  // Regular group header (collapsible with reorder controls)
  return (
    <div className="flex items-center gap-3 w-full py-2 group/header">
      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
      >
        <div
          className="w-1 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.color || "#6b7280" }}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {group.name}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
          {projectCount}
        </span>
        <div className="flex-1 h-px bg-border ml-2" />
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Reorder controls - visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp?.();
          }}
          disabled={!canMoveUp}
          aria-label="Move group up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown?.();
          }}
          disabled={!canMoveDown}
          aria-label="Move group down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
