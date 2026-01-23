"use client";

/**
 * Projects List Component - Compact Inline Design
 *
 * Features:
 * - Compact inline layout with stats on the right
 * - 7-day activity sparklines
 * - Collapsible groups with elegant headers
 * - Sort, filter, and merge functionality
 * - Responsive: stats wrap to second row below 1024px
 */

import { ProjectGroupSection } from "./ProjectGroupSection";
import { ProjectsToolbar } from "./ProjectsToolbar";
import { MergeDialog } from "./MergeDialog";
import { useProjectsListState } from "./useProjectsListState";
import type { Project, ProjectGroup } from "@/types/electron";

interface ProjectsListProps {
  projects: Project[];
  groups: ProjectGroup[];
  onSetHidden: (project: Project, hidden: boolean) => void;
  onSetGroup: (project: Project, groupId: string | null) => void;
  onMerge: (sourcePaths: string[], targetPath: string) => void;
  onUnmerge: (path: string) => void;
}

/**
 * Sortable projects list component with grouping support and merge functionality
 */
export function ProjectsList({
  projects,
  groups,
  onSetHidden,
  onSetGroup,
  onMerge,
  onUnmerge,
}: ProjectsListProps) {
  const {
    sortField,
    sortOrder,
    handleSort,
    showHidden,
    setShowHidden,
    collapsedGroups,
    toggleGroupCollapse,
    isSelectMode,
    selectedProjects,
    toggleProjectSelection,
    enterSelectMode,
    cancelSelectMode,
    showMergeDialog,
    setShowMergeDialog,
    selectedPrimary,
    setSelectedPrimary,
    handleMergeClick,
    handleMergeConfirm,
    mergedByPrimary,
    filteredProjects,
    groupedProjects,
    hiddenCount,
    getAggregatedProject,
    handleRowClick,
  } = useProjectsListState({ projects, groups, onMerge });

  return (
    <div className="space-y-6">
      <ProjectsToolbar
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        showHidden={showHidden}
        onShowHiddenChange={setShowHidden}
        hiddenCount={hiddenCount}
        isSelectMode={isSelectMode}
        selectedCount={selectedProjects.size}
        onMergeClick={handleMergeClick}
        onEnterSelectMode={enterSelectMode}
        onCancelSelectMode={cancelSelectMode}
      />

      {/* Project List */}
      <div className="space-y-8">
        {groupedProjects.map(({ group, projects: groupProjects }) => (
          <ProjectGroupSection
            key={group?.id ?? "ungrouped"}
            group={group}
            projects={groupProjects}
            groups={groups}
            isCollapsed={group ? collapsedGroups.has(group.id) : false}
            onToggleCollapse={() => group && toggleGroupCollapse(group.id)}
            showHeader={group !== null || (groups.length > 0 && groupedProjects.length > 1)}
            getAggregatedProject={getAggregatedProject}
            mergedByPrimary={mergedByPrimary}
            isSelectMode={isSelectMode}
            selectedProjects={selectedProjects}
            onRowClick={handleRowClick}
            onSetHidden={onSetHidden}
            onSetGroup={onSetGroup}
            onUnmerge={onUnmerge}
            onToggleSelection={toggleProjectSelection}
          />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {projects.length === 0 ? "No projects found" : "All projects are hidden"}
        </div>
      )}

      <MergeDialog
        open={showMergeDialog}
        onOpenChange={setShowMergeDialog}
        selectedPaths={selectedProjects}
        projects={projects}
        selectedPrimary={selectedPrimary}
        onSelectPrimary={setSelectedPrimary}
        onConfirm={handleMergeConfirm}
      />
    </div>
  );
}
