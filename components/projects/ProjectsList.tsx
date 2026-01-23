"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDuration } from "@/lib/formatters/time";
import {
  ChevronDown,
  ChevronRight,
  GitMerge,
  MoreHorizontal,
  Clock,
  Calendar,
  FolderOpen,
  Eye,
  EyeOff,
  FolderPlus,
  FolderMinus,
  Unlink,
  Check,
  X,
  ArrowUpDown,
} from "lucide-react";
import type { Project, ProjectGroup } from "@/types/electron";

type SortField = "name" | "sessionCount" | "totalTime" | "lastActivity";
type SortOrder = "asc" | "desc";

interface ProjectsListProps {
  projects: Project[];
  groups: ProjectGroup[];
  onSetHidden: (project: Project, hidden: boolean) => void;
  onSetGroup: (project: Project, groupId: string | null) => void;
  onMerge: (sourcePaths: string[], targetPath: string) => void;
  onUnmerge: (path: string) => void;
}

interface GroupedProjects {
  group: ProjectGroup | null;
  projects: Project[];
}

/**
 * Format the last activity date for display
 */
function formatLastActivity(lastActivity: string): string {
  const date = new Date(lastActivity);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

/**
 * Sortable projects list component with grouping support and merge functionality
 */
// eslint-disable-next-line complexity
export function ProjectsList({
  projects,
  groups,
  onSetHidden,
  onSetGroup,
  onMerge,
  onUnmerge,
}: ProjectsListProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("lastActivity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showHidden, setShowHidden] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);

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

  const toggleProjectSelection = (projectPath: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectPath)) {
        next.delete(projectPath);
      } else {
        next.add(projectPath);
      }
      return next;
    });
  };

  const handleMergeClick = () => {
    if (selectedProjects.size >= 2) {
      setSelectedPrimary(null);
      setShowMergeDialog(true);
    }
  };

  const handleMergeConfirm = () => {
    if (selectedPrimary && selectedProjects.size >= 2) {
      const sourcePaths = Array.from(selectedProjects).filter((p) => p !== selectedPrimary);
      onMerge(sourcePaths, selectedPrimary);
      setSelectedProjects(new Set());
      setShowMergeDialog(false);
      setSelectedPrimary(null);
      setIsSelectMode(false);
    }
  };

  const cancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedProjects(new Set());
  };

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

  // Filter and sort projects (exclude merged projects from main list)
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter out merged projects (they don't show in main list)
    filtered = filtered.filter((p) => !p.mergedInto);

    // Filter hidden projects if not showing them
    if (!showHidden) {
      filtered = filtered.filter((p) => !p.isHidden);
    }

    return filtered;
  }, [projects, showHidden]);

  // Aggregate stats for primary projects that have merged projects
  const getAggregatedProject = (project: Project): Project => {
    const mergedProjects = mergedByPrimary.get(project.path);
    if (!mergedProjects || mergedProjects.length === 0) {
      return project;
    }

    const aggregatedSessionCount =
      project.sessionCount + mergedProjects.reduce((sum, p) => sum + p.sessionCount, 0);
    const aggregatedTotalTime =
      project.totalTime + mergedProjects.reduce((sum, p) => sum + p.totalTime, 0);
    const aggregatedMessageCount =
      project.messageCount + mergedProjects.reduce((sum, p) => sum + p.messageCount, 0);

    return {
      ...project,
      sessionCount: aggregatedSessionCount,
      totalTime: aggregatedTotalTime,
      messageCount: aggregatedMessageCount,
    };
  };

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
    if (isSelectMode) {
      toggleProjectSelection(project.path);
    } else {
      const encodedPath = encodeURIComponent(project.path);
      router.push(`/projects/${encodedPath}`);
    }
  };

  const hiddenCount = projects.filter((p) => p.isHidden && !p.mergedInto).length;

  // Calculate max values for relative sizing
  const maxSessions = Math.max(...filteredProjects.map((p) => p.sessionCount), 1);
  const maxTime = Math.max(...filteredProjects.map((p) => p.totalTime), 1);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                Sort by{" "}
                {sortField === "lastActivity"
                  ? "Activity"
                  : sortField === "sessionCount"
                    ? "Sessions"
                    : sortField === "totalTime"
                      ? "Time"
                      : "Name"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleSort("lastActivity")}>
                Last Activity{" "}
                {sortField === "lastActivity" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("sessionCount")}>
                Sessions {sortField === "sessionCount" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("totalTime")}>
                Total Time {sortField === "totalTime" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("name")}>
                Name {sortField === "name" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hiddenCount > 0 && (
            <div className="flex items-center space-x-2">
              <Switch id="show-hidden" checked={showHidden} onCheckedChange={setShowHidden} />
              <Label htmlFor="show-hidden" className="text-sm text-muted-foreground">
                Show hidden ({hiddenCount})
              </Label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <>
              <span className="text-sm text-muted-foreground mr-2">
                {selectedProjects.size} selected
              </span>
              <Button onClick={handleMergeClick} size="sm" disabled={selectedProjects.size < 2}>
                <GitMerge className="mr-2 h-4 w-4" />
                Merge
              </Button>
              <Button onClick={cancelSelectMode} size="sm" variant="ghost">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsSelectMode(true)} size="sm" variant="outline">
              <GitMerge className="mr-2 h-4 w-4" />
              Merge Projects
            </Button>
          )}
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-6">
        {groupedProjects.map(({ group, projects: groupProjects }) => {
          if (group) {
            const isCollapsed = collapsedGroups.has(group.id);
            return (
              <div key={group.id} className="space-y-3">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="flex items-center gap-2 w-full text-left group"
                >
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color || "#6b7280" }}
                  />
                  <span className="font-semibold text-sm">{group.name}</span>
                  <span className="text-xs text-muted-foreground">({groupProjects.length})</span>
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                  )}
                </button>

                {/* Group Projects */}
                {!isCollapsed && (
                  <div
                    className="grid gap-2 pl-4 border-l-2"
                    style={{ borderColor: group.color || "#6b7280" }}
                  >
                    {groupProjects.map((project) => (
                      <ProjectCard
                        key={project.path}
                        project={getAggregatedProject(project)}
                        groups={groups}
                        onClick={() => handleRowClick(project)}
                        onSetHidden={onSetHidden}
                        onSetGroup={onSetGroup}
                        onUnmerge={onUnmerge}
                        isSelectMode={isSelectMode}
                        isSelected={selectedProjects.has(project.path)}
                        onToggleSelection={() => toggleProjectSelection(project.path)}
                        mergedProjects={mergedByPrimary.get(project.path)}
                        maxSessions={maxSessions}
                        maxTime={maxTime}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Ungrouped projects (show without header if there are groups, with header if no groups)
          if (groups.length > 0 && groupedProjects.length > 1 && groupProjects.length > 0) {
            return (
              <div key="ungrouped" className="space-y-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm text-muted-foreground">Ungrouped</span>
                  <span className="text-xs text-muted-foreground">({groupProjects.length})</span>
                </div>
                <div className="grid gap-2">
                  {groupProjects.map((project) => (
                    <ProjectCard
                      key={project.path}
                      project={getAggregatedProject(project)}
                      groups={groups}
                      onClick={() => handleRowClick(project)}
                      onSetHidden={onSetHidden}
                      onSetGroup={onSetGroup}
                      onUnmerge={onUnmerge}
                      isSelectMode={isSelectMode}
                      isSelected={selectedProjects.has(project.path)}
                      onToggleSelection={() => toggleProjectSelection(project.path)}
                      mergedProjects={mergedByPrimary.get(project.path)}
                      maxSessions={maxSessions}
                      maxTime={maxTime}
                    />
                  ))}
                </div>
              </div>
            );
          }

          // Just ungrouped projects without header
          return groupProjects.map((project) => (
            <ProjectCard
              key={project.path}
              project={getAggregatedProject(project)}
              groups={groups}
              onClick={() => handleRowClick(project)}
              onSetHidden={onSetHidden}
              onSetGroup={onSetGroup}
              onUnmerge={onUnmerge}
              isSelectMode={isSelectMode}
              isSelected={selectedProjects.has(project.path)}
              onToggleSelection={() => toggleProjectSelection(project.path)}
              mergedProjects={mergedByPrimary.get(project.path)}
              maxSessions={maxSessions}
              maxTime={maxTime}
            />
          ));
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {projects.length === 0 ? "No projects found" : "All projects are hidden"}
        </div>
      )}

      {/* Merge Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Projects</DialogTitle>
            <DialogDescription>
              Select which project should be the primary. Other projects will be merged into it and
              their stats will be aggregated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {Array.from(selectedProjects).map((path) => {
              const project = projects.find((p) => p.path === path);
              if (!project) return null;
              return (
                <label
                  key={path}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPrimary === path ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="primaryProject"
                    value={path}
                    checked={selectedPrimary === path}
                    onChange={() => setSelectedPrimary(path)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedPrimary === path ? "border-primary" : "border-muted-foreground"
                    }`}
                  >
                    {selectedPrimary === path && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{project.path}</p>
                  </div>
                  {selectedPrimary === path && (
                    <span className="text-xs font-medium text-primary">Primary</span>
                  )}
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMergeConfirm} disabled={!selectedPrimary}>
              <GitMerge className="mr-2 h-4 w-4" />
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProjectCardProps {
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
  maxSessions: number;
  maxTime: number;
}

function ProjectCard({
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
  maxSessions,
  maxTime,
}: ProjectCardProps) {
  const hasMergedProjects = mergedProjects && mergedProjects.length > 0;
  const sessionPercent = (project.sessionCount / maxSessions) * 100;
  const timePercent = (project.totalTime / maxTime) * 100;

  return (
    <Card
      className={`group transition-all cursor-pointer ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50 hover:shadow-sm"
      } ${project.isHidden ? "opacity-60" : ""}`}
      onClick={onClick}
      data-testid={`project-row-${project.path}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Selection checkbox */}
          {isSelectMode && (
            <div
              className="pt-1"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection();
              }}
            >
              <Checkbox checked={isSelected} aria-label={`Select ${project.name}`} />
            </div>
          )}

          {/* Project info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{project.name}</h3>
                  {hasMergedProjects && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      <GitMerge className="h-3 w-3" />
                      {mergedProjects.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate" title={project.path}>
                  {project.path}
                </p>
              </div>

              {/* Actions */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {hasMergedProjects && (
                      <>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <GitMerge className="mr-2 h-4 w-4" />
                            Merged directories ({mergedProjects.length})
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {mergedProjects.map((merged) => (
                              <DropdownMenuItem
                                key={merged.path}
                                onClick={() => onUnmerge(merged.path)}
                              >
                                <Unlink className="mr-2 h-4 w-4" />
                                <span className="truncate max-w-[200px]" title={merged.path}>
                                  {merged.name}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Move to group
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {project.groupId && (
                          <>
                            <DropdownMenuItem onClick={() => onSetGroup(project, null)}>
                              <FolderMinus className="mr-2 h-4 w-4" />
                              Remove from group
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {groups.length === 0 ? (
                          <DropdownMenuItem disabled>No groups available</DropdownMenuItem>
                        ) : (
                          groups.map((group) => (
                            <DropdownMenuItem
                              key={group.id}
                              onClick={() => onSetGroup(project, group.id)}
                              disabled={project.groupId === group.id}
                            >
                              {group.color && (
                                <div
                                  className="mr-2 h-3 w-3 rounded-full"
                                  style={{ backgroundColor: group.color }}
                                />
                              )}
                              {group.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onSetHidden(project, !project.isHidden)}>
                      {project.isHidden ? (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Show project
                        </>
                      ) : (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide project
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 min-w-[100px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{project.sessionCount}</span>
                  <span className="text-xs">sessions</span>
                </div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${sessionPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-[100px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">
                    {formatDuration(project.totalTime)}
                  </span>
                </div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[60px]">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${timePercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatLastActivity(project.lastActivity)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
