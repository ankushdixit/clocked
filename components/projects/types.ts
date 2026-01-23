/**
 * Shared types for project components
 */

import type { Project, ProjectGroup } from "@/types/electron";

export type SortField = "name" | "sessionCount" | "totalTime" | "lastActivity";
export type SortOrder = "asc" | "desc";

export interface GroupedProjects {
  group: ProjectGroup | null;
  projects: Project[];
}

export interface ProjectRowProps {
  project: Project;
  groups: ProjectGroup[];
  onClick: () => void;
  onSetHidden: (project: Project, hidden: boolean) => void;
  onSetGroup: (project: Project, groupId: string | null) => void;
  onUnmerge: (path: string) => void;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
  mergedProjects?: Project[];
  accentColor?: string | null;
}
