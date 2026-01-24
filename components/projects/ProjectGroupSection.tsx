"use client";

/**
 * ProjectGroupSection Component
 *
 * Renders a group of projects with an optional header.
 * Used by ProjectsList to display grouped project listings.
 */

import { ProjectRow } from "./ProjectRow";
import { ProjectGroupHeader } from "./ProjectGroupHeader";
import type { Project, ProjectGroup } from "@/types/electron";

export interface ProjectGroupSectionProps {
  group: ProjectGroup | null;
  projects: Project[];
  groups: ProjectGroup[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  showHeader: boolean;
  getAggregatedProject: (project: Project) => Project;
  mergedByPrimary: Map<string, Project[]>;
  isSelectMode: boolean;
  selectedProjects: Set<string>;
  onRowClick: (project: Project) => void;
  onSetHidden: (project: Project, hidden: boolean) => void;
  onSetGroup: (project: Project, groupId: string | null) => void;
  onUnmerge: (path: string) => void;
  onToggleSelection: (path: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ProjectGroupSection({
  group,
  projects,
  groups,
  isCollapsed,
  onToggleCollapse,
  showHeader,
  getAggregatedProject,
  mergedByPrimary,
  isSelectMode,
  selectedProjects,
  onRowClick,
  onSetHidden,
  onSetGroup,
  onUnmerge,
  onToggleSelection,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: ProjectGroupSectionProps) {
  // Don't show header for ungrouped when there are no other groups
  if (!showHeader && !group) {
    return (
      <div className="space-y-0.5">
        {projects.map((project) => (
          <ProjectRow
            key={project.path}
            project={getAggregatedProject(project)}
            groups={groups}
            onClick={() => onRowClick(project)}
            onSetHidden={onSetHidden}
            onSetGroup={onSetGroup}
            onUnmerge={onUnmerge}
            isSelectMode={isSelectMode}
            isSelected={selectedProjects.has(project.path)}
            onToggleSelection={() => onToggleSelection(project.path)}
            mergedProjects={mergedByPrimary.get(project.path)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <ProjectGroupHeader
        group={group}
        projectCount={projects.length}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />

      {!isCollapsed && (
        <div className={group ? "space-y-0.5 pl-4" : "space-y-0.5"}>
          {projects.map((project) => (
            <ProjectRow
              key={project.path}
              project={getAggregatedProject(project)}
              groups={groups}
              onClick={() => onRowClick(project)}
              onSetHidden={onSetHidden}
              onSetGroup={onSetGroup}
              onUnmerge={onUnmerge}
              isSelectMode={isSelectMode}
              isSelected={selectedProjects.has(project.path)}
              onToggleSelection={() => onToggleSelection(project.path)}
              mergedProjects={mergedByPrimary.get(project.path)}
              accentColor={group?.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}
