"use client";

/**
 * Custom hook for computing derived project data
 *
 * Handles:
 * - Merging project aggregation
 * - Filtering projects
 * - Sorting projects
 * - Grouping projects
 */

import { useMemo, useCallback } from "react";
import type { Project, ProjectGroup } from "@/types/electron";
import type { SortField, SortOrder, GroupedProjects } from "./types";

interface UseProjectsDataProps {
  projects: Project[];
  groups: ProjectGroup[];
  sortField: SortField;
  sortOrder: SortOrder;
  showHidden: boolean;
}

export function useProjectsData({
  projects,
  groups,
  sortField,
  sortOrder,
  showHidden,
}: UseProjectsDataProps) {
  // Get merged projects grouped by primary
  const mergedByPrimary = useMemo(() => {
    const map = new Map<string, Project[]>();
    projects.forEach((p) => {
      if (p.mergedInto) {
        const existing = map.get(p.mergedInto) || [];
        existing.push(p);
        map.set(p.mergedInto, existing);
      }
    });
    return map;
  }, [projects]);

  // Filter projects (exclude merged projects from main list)
  const filteredProjects = useMemo(() => {
    let filtered = projects;
    filtered = filtered.filter((p) => !p.mergedInto);
    if (!showHidden) {
      filtered = filtered.filter((p) => !p.isHidden);
    }
    return filtered;
  }, [projects, showHidden]);

  // Aggregate stats for primary projects that have merged projects
  const getAggregatedProject = useCallback(
    (project: Project): Project => {
      const mergedProjects = mergedByPrimary.get(project.path);
      if (!mergedProjects || mergedProjects.length === 0) {
        return project;
      }
      return {
        ...project,
        sessionCount:
          project.sessionCount + mergedProjects.reduce((sum, p) => sum + p.sessionCount, 0),
        totalTime: project.totalTime + mergedProjects.reduce((sum, p) => sum + p.totalTime, 0),
        messageCount:
          project.messageCount + mergedProjects.reduce((sum, p) => sum + p.messageCount, 0),
      };
    },
    [mergedByPrimary]
  );

  // Sort projects
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortField) {
        case "sessionCount":
          return (a.sessionCount - b.sessionCount) * multiplier;
        case "totalTime":
          return (a.totalTime - b.totalTime) * multiplier;
        case "lastActivity":
          return (
            (new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()) * multiplier
          );
        default:
          return a.name.localeCompare(b.name) * multiplier;
      }
    });
  }, [filteredProjects, sortField, sortOrder]);

  // Group projects
  const groupedProjects = useMemo((): GroupedProjects[] => {
    const groupMap = new Map<string | null, Project[]>();
    groupMap.set(null, []);
    groups.forEach((g) => groupMap.set(g.id, []));

    sortedProjects.forEach((project) => {
      const list = groupMap.get(project.groupId) ?? groupMap.get(null)!;
      list.push(project);
    });

    const result: GroupedProjects[] = [];
    groups.forEach((group) => {
      const groupProjects = groupMap.get(group.id) || [];
      if (groupProjects.length > 0) {
        result.push({ group, projects: groupProjects });
      }
    });

    const ungrouped = groupMap.get(null) || [];
    if (ungrouped.length > 0 || result.length === 0) {
      result.push({ group: null, projects: ungrouped });
    }

    return result;
  }, [sortedProjects, groups]);

  // Count of hidden projects
  const hiddenCount = useMemo(
    () => projects.filter((p) => p.isHidden && !p.mergedInto).length,
    [projects]
  );

  return {
    mergedByPrimary,
    filteredProjects,
    sortedProjects,
    groupedProjects,
    hiddenCount,
    getAggregatedProject,
  };
}
