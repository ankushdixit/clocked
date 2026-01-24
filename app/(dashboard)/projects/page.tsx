"use client";

import { useCallback } from "react";
import { useList, useUpdate, useInvalidate } from "@refinedev/core";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2 } from "lucide-react";
import type { Project, ProjectGroup } from "@/types/electron";

/** Loading spinner displayed while fetching projects */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Error state when projects fail to load */
function ErrorState() {
  return (
    <EmptyState
      title="Error loading projects"
      description="There was an error loading your projects. Please try again."
    />
  );
}

/** Empty state when no projects exist */
function NoProjectsState() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
      <EmptyState
        title="No Claude Code sessions found"
        description="Start using Claude Code to see your activity here"
      />
    </div>
  );
}

/** Hook for project action handlers */
function useProjectHandlers(groups: ProjectGroup[]) {
  const invalidate = useInvalidate();
  const { mutate: updateProject } = useUpdate<Project>();
  const { mutate: updateGroup } = useUpdate<ProjectGroup>();

  const handleSetHidden = useCallback(
    (project: Project, hidden: boolean) => {
      updateProject(
        { resource: "projects", id: project.path, values: { isHidden: hidden } },
        { onSuccess: () => invalidate({ resource: "projects", invalidates: ["list"] }) }
      );
    },
    [updateProject, invalidate]
  );

  const handleSetGroup = useCallback(
    (project: Project, groupId: string | null) => {
      updateProject(
        { resource: "projects", id: project.path, values: { groupId } },
        { onSuccess: () => invalidate({ resource: "projects", invalidates: ["list"] }) }
      );
    },
    [updateProject, invalidate]
  );

  const handleMerge = useCallback(
    (sourcePaths: string[], targetPath: string) => {
      updateProject(
        { resource: "projects", id: targetPath, values: { mergeSources: sourcePaths } },
        { onSuccess: () => invalidate({ resource: "projects", invalidates: ["list"] }) }
      );
    },
    [updateProject, invalidate]
  );

  const handleUnmerge = useCallback(
    (path: string) => {
      updateProject(
        { resource: "projects", id: path, values: { mergedInto: null } },
        { onSuccess: () => invalidate({ resource: "projects", invalidates: ["list"] }) }
      );
    },
    [updateProject, invalidate]
  );

  const handleReorderGroup = useCallback(
    (groupId: string, direction: "up" | "down") => {
      const currentIndex = groups.findIndex((g) => g.id === groupId);
      if (currentIndex === -1) return;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= groups.length) return;
      const currentGroup = groups[currentIndex];
      const targetGroup = groups[targetIndex];
      updateGroup(
        { resource: "groups", id: currentGroup.id, values: { sortOrder: targetGroup.sortOrder } },
        {
          onSuccess: () => {
            updateGroup(
              {
                resource: "groups",
                id: targetGroup.id,
                values: { sortOrder: currentGroup.sortOrder },
              },
              { onSuccess: () => invalidate({ resource: "groups", invalidates: ["list"] }) }
            );
          },
        }
      );
    },
    [groups, updateGroup, invalidate]
  );

  return {
    onSetHidden: handleSetHidden,
    onSetGroup: handleSetGroup,
    onMerge: handleMerge,
    onUnmerge: handleUnmerge,
    onReorderGroup: handleReorderGroup,
  };
}

/** Projects list page - Displays all Claude Code projects with sortable columns */
export default function ProjectsPage() {
  const { query: projectsQuery, result: projectsResult } = useList<Project>({
    resource: "projects",
    pagination: { pageSize: 1000 },
  });
  const { query: groupsQuery, result: groupsResult } = useList<ProjectGroup>({
    resource: "groups",
  });

  const projects = projectsResult.data ?? [];
  const groups = groupsResult.data ?? [];
  const handlers = useProjectHandlers(groups);

  if (projectsQuery.isLoading || groupsQuery.isLoading) return <LoadingState />;
  if (projectsQuery.isError) return <ErrorState />;
  if (projects.length === 0) return <NoProjectsState />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
      <ProjectsList projects={projects} groups={groups} {...handlers} />
    </div>
  );
}
