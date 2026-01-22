"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProjectRow } from "./ProjectRow";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import type { Project, ProjectGroup } from "@/types/electron";

type SortField = "name" | "sessionCount" | "totalTime" | "lastActivity";
type SortOrder = "asc" | "desc";

interface ProjectsListProps {
  projects: Project[];
  groups: ProjectGroup[];
  onSetHidden: (project: Project, hidden: boolean) => void;
  onSetGroup: (project: Project, groupId: string | null) => void;
  onSetDefault: (project: Project) => void;
}

interface GroupedProjects {
  group: ProjectGroup | null;
  projects: Project[];
}

/**
 * Sortable projects list component with grouping support
 */
export function ProjectsList({
  projects,
  groups,
  onSetHidden,
  onSetGroup,
  onSetDefault,
}: ProjectsListProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("lastActivity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showHidden, setShowHidden] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter hidden projects if not showing them
    if (!showHidden) {
      filtered = filtered.filter((p) => !p.isHidden);
    }

    return filtered;
  }, [projects, showHidden]);

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

    // Initialize groups
    groupMap.set(null, []); // ungrouped projects
    groups.forEach((g) => groupMap.set(g.id, []));

    // Distribute projects to groups
    sortedProjects.forEach((project) => {
      const list = groupMap.get(project.groupId) ?? groupMap.get(null)!;
      list.push(project);
    });

    // Build result array
    const result: GroupedProjects[] = [];

    // Add grouped projects first
    groups.forEach((group) => {
      const groupProjects = groupMap.get(group.id) || [];
      if (groupProjects.length > 0) {
        result.push({ group, projects: groupProjects });
      }
    });

    // Add ungrouped projects last
    const ungrouped = groupMap.get(null) || [];
    if (ungrouped.length > 0 || result.length === 0) {
      result.push({ group: null, projects: ungrouped });
    }

    return result;
  }, [sortedProjects, groups]);

  const handleRowClick = (project: Project) => {
    const encodedPath = encodeURIComponent(project.path);
    router.push(`/projects/${encodedPath}`);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    );
  };

  const hiddenCount = projects.filter((p) => p.isHidden).length;

  return (
    <div className="space-y-4">
      {hiddenCount > 0 && (
        <div className="flex items-center space-x-2">
          <Switch id="show-hidden" checked={showHidden} onCheckedChange={setShowHidden} />
          <Label htmlFor="show-hidden" className="text-sm text-muted-foreground">
            Show hidden projects ({hiddenCount})
          </Label>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              onClick={() => handleSort("name")}
              className="cursor-pointer select-none hover:bg-muted/50"
            >
              Project
              <SortIcon field="name" />
            </TableHead>
            <TableHead
              onClick={() => handleSort("sessionCount")}
              className="cursor-pointer select-none hover:bg-muted/50"
            >
              Sessions
              <SortIcon field="sessionCount" />
            </TableHead>
            <TableHead
              onClick={() => handleSort("totalTime")}
              className="cursor-pointer select-none hover:bg-muted/50"
            >
              Time
              <SortIcon field="totalTime" />
            </TableHead>
            <TableHead
              onClick={() => handleSort("lastActivity")}
              className="cursor-pointer select-none hover:bg-muted/50"
            >
              Last Activity
              <SortIcon field="lastActivity" />
            </TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedProjects.map(({ group, projects: groupProjects }) => {
            if (group) {
              const isCollapsed = collapsedGroups.has(group.id);
              return (
                <GroupSection
                  key={group.id}
                  group={group}
                  projects={groupProjects}
                  groups={groups}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleGroupCollapse(group.id)}
                  onRowClick={handleRowClick}
                  onSetHidden={onSetHidden}
                  onSetGroup={onSetGroup}
                  onSetDefault={onSetDefault}
                />
              );
            }

            // Ungrouped projects
            return groupProjects.map((project) => (
              <ProjectRow
                key={project.path}
                project={project}
                groups={groups}
                onClick={handleRowClick}
                onSetHidden={onSetHidden}
                onSetGroup={onSetGroup}
                onSetDefault={onSetDefault}
              />
            ));
          })}
        </TableBody>
      </Table>

      {filteredProjects.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {projects.length === 0 ? "No projects found" : "All projects are hidden"}
        </div>
      )}
    </div>
  );
}

interface GroupSectionProps {
  group: ProjectGroup;
  projects: Project[];
  groups: ProjectGroup[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRowClick: (project: Project) => void;
  onSetHidden: (project: Project, hidden: boolean) => void;
  onSetGroup: (project: Project, groupId: string | null) => void;
  onSetDefault: (project: Project) => void;
}

function GroupSection({
  group,
  projects,
  groups,
  isCollapsed,
  onToggleCollapse,
  onRowClick,
  onSetHidden,
  onSetGroup,
  onSetDefault,
}: GroupSectionProps) {
  return (
    <>
      <TableRow className="bg-muted/30 hover:bg-muted/50 cursor-pointer" onClick={onToggleCollapse}>
        <td colSpan={5} className="p-2">
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {group.color && (
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
            )}
            <span className="font-medium">{group.name}</span>
            <span className="text-muted-foreground text-sm">({projects.length})</span>
          </div>
        </td>
      </TableRow>
      {!isCollapsed &&
        projects.map((project) => (
          <ProjectRow
            key={project.path}
            project={project}
            groups={groups}
            onClick={onRowClick}
            onSetHidden={onSetHidden}
            onSetGroup={onSetGroup}
            onSetDefault={onSetDefault}
          />
        ))}
    </>
  );
}
