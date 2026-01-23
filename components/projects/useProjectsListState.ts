"use client";

/**
 * Custom hook for managing ProjectsList UI state and interactions
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProjectsData } from "./useProjectsData";
import type { Project, ProjectGroup } from "@/types/electron";
import type { SortField, SortOrder } from "./types";

interface UseProjectsListStateProps {
  projects: Project[];
  groups: ProjectGroup[];
  onMerge: (sourcePaths: string[], targetPath: string) => void;
}

export function useProjectsListState({ projects, groups, onMerge }: UseProjectsListStateProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("lastActivity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showHidden, setShowHidden] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);

  const { mergedByPrimary, filteredProjects, groupedProjects, hiddenCount, getAggregatedProject } =
    useProjectsData({ projects, groups, sortField, sortOrder, showHidden });

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortOrder("desc");
      }
    },
    [sortField, sortOrder]
  );

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const toggleProjectSelection = useCallback((projectPath: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectPath)) next.delete(projectPath);
      else next.add(projectPath);
      return next;
    });
  }, []);

  const enterSelectMode = useCallback(() => setIsSelectMode(true), []);
  const cancelSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedProjects(new Set());
  }, []);

  const handleMergeClick = useCallback(() => {
    if (selectedProjects.size >= 2) {
      setSelectedPrimary(null);
      setShowMergeDialog(true);
    }
  }, [selectedProjects.size]);

  const handleMergeConfirm = useCallback(() => {
    if (selectedPrimary && selectedProjects.size >= 2) {
      const sourcePaths = Array.from(selectedProjects).filter((p) => p !== selectedPrimary);
      onMerge(sourcePaths, selectedPrimary);
      setSelectedProjects(new Set());
      setShowMergeDialog(false);
      setSelectedPrimary(null);
      setIsSelectMode(false);
    }
  }, [selectedPrimary, selectedProjects, onMerge]);

  const handleRowClick = useCallback(
    (project: Project) => {
      if (isSelectMode) {
        toggleProjectSelection(project.path);
      } else {
        router.push(`/projects/${encodeURIComponent(project.path)}`);
      }
    },
    [isSelectMode, toggleProjectSelection, router]
  );

  return {
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
  };
}
