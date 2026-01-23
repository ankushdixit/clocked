"use client";

/**
 * Project row component
 * Displays a single project with name, path, stats, and action menu
 */

import { Checkbox } from "@/components/ui/checkbox";
import { GitMerge } from "lucide-react";
import { ProjectRowStats } from "./ProjectRowStats";
import { ProjectRowActionMenu } from "./ProjectRowActionMenu";
import type { ProjectRowProps } from "./types";

/**
 * Get styles for selected state based on accent color
 */
function getSelectedStyles(isSelected: boolean, accentColor?: string | null) {
  if (!isSelected || !accentColor) return {};
  return {
    backgroundColor: `${accentColor}10`,
    boxShadow: `inset 0 0 0 1px ${accentColor}`,
  };
}

/**
 * Get CSS classes for the row container
 */
function getRowClasses(isSelected: boolean, isHidden: boolean, accentColor?: string | null) {
  const base =
    "group relative flex flex-wrap lg:flex-nowrap items-center gap-x-4 gap-y-2 py-3 px-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50";
  const selectedClass = isSelected && !accentColor ? "bg-primary/5 ring-1 ring-primary" : "";
  const hiddenClass = isHidden ? "opacity-60" : "";
  return `${base} ${selectedClass} ${hiddenClass}`;
}

export function ProjectRow({
  project,
  groups,
  onClick,
  onSetHidden,
  onSetGroup,
  onUnmerge,
  isSelectMode,
  isSelected,
  onToggleSelection,
  mergedProjects,
  accentColor,
}: ProjectRowProps) {
  const hasMergedProjects = mergedProjects && mergedProjects.length > 0;

  return (
    <div
      onClick={onClick}
      className={getRowClasses(isSelected, project.isHidden, accentColor)}
      style={getSelectedStyles(isSelected, accentColor)}
      data-testid={`project-row-${project.path}`}
    >
      {/* Left accent bar on hover */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block"
        style={{ backgroundColor: accentColor || "var(--color-primary)" }}
      />

      {/* Selection checkbox */}
      {isSelectMode && (
        <ProjectRowCheckbox
          projectName={project.name}
          isSelected={isSelected}
          accentColor={accentColor}
          onToggle={onToggleSelection}
        />
      )}

      {/* Project name and path */}
      <div className="flex-1 min-w-0 order-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          {hasMergedProjects && <MergedBadge count={mergedProjects.length} />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{project.path}</p>
      </div>

      {/* Action menu */}
      <ProjectRowActionMenu
        project={project}
        groups={groups}
        mergedProjects={mergedProjects}
        onSetHidden={onSetHidden}
        onSetGroup={onSetGroup}
        onUnmerge={onUnmerge}
      />

      {/* Stats with sparkline */}
      <ProjectRowStats project={project} accentColor={accentColor} />
    </div>
  );
}

interface ProjectRowCheckboxProps {
  projectName: string;
  isSelected: boolean;
  accentColor?: string | null;
  onToggle: () => void;
}

function ProjectRowCheckbox({
  projectName,
  isSelected,
  accentColor,
  onToggle,
}: ProjectRowCheckboxProps) {
  const checkboxStyle = accentColor ? { color: accentColor, borderColor: accentColor } : undefined;

  return (
    <div
      className="order-0"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <Checkbox
        checked={isSelected}
        aria-label={`Select ${projectName}`}
        className={accentColor ? "border-current" : ""}
        style={checkboxStyle as React.CSSProperties}
      />
    </div>
  );
}

function MergedBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
      <GitMerge className="h-3 w-3" />
      {count}
    </span>
  );
}
