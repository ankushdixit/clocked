"use client";

/**
 * Project Detail Page
 *
 * Displays comprehensive metrics for a single project including:
 * - Time layers (wall clock, session, active time)
 * - Activity metrics (sessions, messages, tool calls)
 * - Human vs AI time breakdown
 * - Cost analysis
 * - Tool usage chart
 * - Merged projects (if any)
 * - Recent sessions list (aggregated from primary + merged projects)
 */

import { useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOne, useList, useUpdate, useInvalidate } from "@refinedev/core";
import { ArrowLeft, Loader2, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TimeLayersCard } from "@/components/projects/TimeLayersCard";
import { ActivityMetricsCard } from "@/components/projects/ActivityMetricsCard";
import { HumanVsAICard } from "@/components/projects/HumanVsAICard";
import { CostAnalysisCard } from "@/components/projects/CostAnalysisCard";
import { ToolUsageCard } from "@/components/projects/ToolUsageCard";
import { MergedProjectsCard } from "@/components/projects/MergedProjectsCard";
import { SessionsList } from "@/components/projects/SessionsList";
import type { Project, Session } from "@/types/electron";

/** Calculate total session time from sessions array */
function calculateTotalSessionTime(sessions: Session[]): number {
  return sessions.reduce((total, session) => total + session.duration, 0);
}

/** Loading spinner displayed while fetching data */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Not found state with back button */
function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to projects">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-muted-foreground">Project not found</span>
      </header>
      <EmptyState
        title="Project not found"
        description="The project you're looking for doesn't exist or may have been removed."
      />
    </div>
  );
}

// Mock data for design preview (remove when real data is available)
const MOCK_DATA = {
  activeTime: 10224000,
  humanTime: 6550000,
  claudeTime: 3674000,
  toolCalls: 1245,
  costs: { input: 156.4, output: 234.8, cacheWrite: 12.3, cacheRead: 9.0, savings: 89.2 },
  toolUsage: [
    { name: "Bash", count: 3421 },
    { name: "Edit", count: 2156 },
    { name: "Read", count: 1892 },
    { name: "Write", count: 1456 },
    { name: "Glob", count: 1102 },
    { name: "Grep", count: 1045 },
    { name: "Task", count: 784 },
  ],
};

/** Project metrics cards grid */
function ProjectMetrics({ project, sessions }: { project: Project; sessions: Session[] }) {
  const totalSessionTime = calculateTotalSessionTime(sessions);
  const totalMessages = sessions.reduce((sum: number, s: Session) => sum + s.messageCount, 0);
  const avgSessionDuration = sessions.length > 0 ? totalSessionTime / sessions.length : 0;
  const avgMessagesPerSession = sessions.length > 0 ? totalMessages / sessions.length : 0;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimeLayersCard
          wallClockStart={project.firstActivity}
          wallClockEnd={project.lastActivity}
          sessionTime={totalSessionTime}
          activeTime={MOCK_DATA.activeTime}
          humanTime={MOCK_DATA.humanTime}
          claudeTime={MOCK_DATA.claudeTime}
        />
        <ActivityMetricsCard
          sessionCount={sessions.length}
          messageCount={totalMessages}
          toolCalls={MOCK_DATA.toolCalls}
          avgSessionDuration={avgSessionDuration}
          avgMessagesPerSession={avgMessagesPerSession}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HumanVsAICard humanTime={MOCK_DATA.humanTime} claudeTime={MOCK_DATA.claudeTime} />
        <CostAnalysisCard
          inputCost={MOCK_DATA.costs.input}
          outputCost={MOCK_DATA.costs.output}
          cacheWriteCost={MOCK_DATA.costs.cacheWrite}
          cacheReadCost={MOCK_DATA.costs.cacheRead}
          cacheSavings={MOCK_DATA.costs.savings}
        />
      </div>
      <ToolUsageCard toolUsage={MOCK_DATA.toolUsage} />
    </>
  );
}

/** Page header with back button and project name */
function PageHeader({
  project,
  mergedCount,
  onBack,
}: {
  project: Project;
  mergedCount: number;
  onBack: () => void;
}) {
  return (
    <header>
      <div className="flex items-center gap-3 mb-1">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to projects">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        {mergedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <GitMerge className="h-3 w-3" />
            {mergedCount} merged
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground ml-10">{project.path}</p>
    </header>
  );
}

/** Sessions section with list or empty state */
function SessionsSection({ sessions }: { sessions: Session[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Recent Sessions</h2>
      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions found for this project"
          description="Sessions will appear here as you use Claude Code"
        />
      ) : (
        <SessionsList sessions={sessions} />
      )}
    </section>
  );
}

/** Hook to fetch and aggregate project detail data */
function useProjectDetailData(projectPath: string) {
  const { query: projectQuery, result: projectResult } = useOne<Project>({
    resource: "projects",
    id: projectPath,
  });

  const { query: allProjectsQuery, result: allProjectsResult } = useList<Project>({
    resource: "projects",
    pagination: { pageSize: 1000 },
  });

  const { query: sessionsQuery, result: sessionsResult } = useList<Session>({
    resource: "sessions",
    filters: [{ field: "projectPath", operator: "eq", value: projectPath }],
    sorters: [{ field: "modified", order: "desc" }],
    pagination: { pageSize: 100 },
  });

  const mergedProjects = useMemo(() => {
    return (allProjectsResult?.data ?? []).filter((p) => p.mergedInto === projectPath);
  }, [allProjectsResult?.data, projectPath]);

  const hasMergedProjects = mergedProjects.length > 0;

  const { query: mergedSessionsQuery, result: mergedSessionsResult } = useList<Session>({
    resource: "sessions",
    pagination: { pageSize: 1000 },
    queryOptions: { enabled: hasMergedProjects },
  });

  const allSessions = useMemo(() => {
    const primary = sessionsResult?.data ?? [];
    if (!hasMergedProjects) return primary;

    const mergedPaths = new Set(mergedProjects.map((p) => p.path));
    const merged = (mergedSessionsResult?.data ?? []).filter((s) => mergedPaths.has(s.projectPath));

    return [...primary, ...merged].sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );
  }, [sessionsResult?.data, mergedSessionsResult?.data, mergedProjects, hasMergedProjects]);

  const isLoadingCore =
    projectQuery.isLoading || sessionsQuery.isLoading || allProjectsQuery.isLoading;
  const isLoadingMerged = hasMergedProjects && mergedSessionsQuery.isLoading;
  const isLoading = isLoadingCore || isLoadingMerged;

  return {
    project: projectResult,
    mergedProjects,
    allSessions,
    isLoading,
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectPath = decodeURIComponent(params.path as string);

  const { mutate: updateProject } = useUpdate();
  const invalidate = useInvalidate();

  const { project, mergedProjects, allSessions, isLoading } = useProjectDetailData(projectPath);

  const handleBack = useCallback(() => router.push("/projects"), [router]);

  const handleUnmerge = useCallback(
    (path: string) => {
      updateProject(
        { resource: "projects", id: path, values: { mergedInto: null } },
        { onSuccess: () => invalidate({ resource: "projects", invalidates: ["list"] }) }
      );
    },
    [updateProject, invalidate]
  );

  if (isLoading) return <LoadingState />;
  if (!project) return <NotFoundState onBack={handleBack} />;

  return (
    <div className="space-y-4">
      <PageHeader project={project} mergedCount={mergedProjects.length} onBack={handleBack} />
      <ProjectMetrics project={project} sessions={allSessions} />
      {mergedProjects.length > 0 && (
        <MergedProjectsCard mergedProjects={mergedProjects} onUnmerge={handleUnmerge} />
      )}
      <SessionsSection sessions={allSessions} />
    </div>
  );
}
