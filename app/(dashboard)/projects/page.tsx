"use client";

import { useList, useUpdate, useInvalidate } from "@refinedev/core";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2 } from "lucide-react";
import type { Project, ProjectGroup } from "@/types/electron";

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

  const handleSetDefault = (project: Project) => {
    updateProject(
      {
        resource: "projects",
        id: project.path,
        values: { isDefault: true },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );
  };

  if (projectsQuery.isLoading || groupsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projectsQuery.isError) {
    return (
      <EmptyState
        title="Error loading projects"
        description="There was an error loading your projects. Please try again."
      />
    );
  }

  const projects = projectsResult.data ?? [];
  const groups = groupsResult.data ?? [];

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Your Claude Code projects</p>
        </div>
        <EmptyState
          title="No Claude Code sessions found"
          description="Start using Claude Code to see your activity here"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground">Your Claude Code projects</p>
      </div>
      <ProjectsList
        projects={projects}
        groups={groups}
        onSetHidden={handleSetHidden}
        onSetGroup={handleSetGroup}
        onSetDefault={handleSetDefault}
      />
    </div>
  );
}
