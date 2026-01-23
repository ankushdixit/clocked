"use client";

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

/**
 * Projects list page
 * Displays all Claude Code projects with sortable columns
 */
export default function ProjectsPage() {
  const invalidate = useInvalidate();

  const { query: projectsQuery, result: projectsResult } = useList<Project>({
    resource: "projects",
    pagination: {
      pageSize: 1000, // Get all projects
    },
  });

  const { query: groupsQuery, result: groupsResult } = useList<ProjectGroup>({
    resource: "groups",
  });

  const { mutate: updateProject } = useUpdate<Project>();

  const handleSetHidden = (project: Project, hidden: boolean) => {
    updateProject(
      {
        resource: "projects",
        id: project.path,
        values: { isHidden: hidden },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );
  };

  const handleSetGroup = (project: Project, groupId: string | null) => {
    updateProject(
      {
        resource: "projects",
        id: project.path,
        values: { groupId },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );
  };

  const handleMerge = (sourcePaths: string[], targetPath: string) => {
    updateProject(
      {
        resource: "projects",
        id: targetPath,
        values: { mergeSources: sourcePaths },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );
  };

  const handleUnmerge = (path: string) => {
    updateProject(
      {
        resource: "projects",
        id: path,
        values: { mergedInto: null },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );
  };

  if (projectsQuery.isLoading || groupsQuery.isLoading) {
    return <LoadingState />;
  }

  if (projectsQuery.isError) {
    return <ErrorState />;
  }

  const projects = projectsResult.data ?? [];
  const groups = groupsResult.data ?? [];

  if (projects.length === 0) {
    return <NoProjectsState />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
      <ProjectsList
        projects={projects}
        groups={groups}
        onSetHidden={handleSetHidden}
        onSetGroup={handleSetGroup}
        onMerge={handleMerge}
        onUnmerge={handleUnmerge}
      />
    </div>
  );
}
