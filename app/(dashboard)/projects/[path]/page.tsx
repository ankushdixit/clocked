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
import {
  ArrowLeft,
  Loader2,
  GitMerge,
  Activity,
  Clock,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroMetricCard } from "@/components/dashboard/HeroMetricCard";
import { TimeBreakdownCard } from "@/components/projects/TimeBreakdownCard";
import { ProjectQuickStatsCard } from "@/components/projects/ProjectQuickStatsCard";
import { CostAnalysisCard } from "@/components/projects/CostAnalysisCard";
import { MergedProjectsCard } from "@/components/projects/MergedProjectsCard";
import { SessionsList } from "@/components/projects/SessionsList";
import { formatDuration } from "@/lib/formatters/time";
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
  // Time breakdown
  rawSessionTime: 76 * 60 * 60 * 1000, // 76 hours raw session time
  filteredSessionTime: 10224000, // ~2h 50m active time after filtering
  humanTime: 6550000, // ~1h 49m human time
  claudeTime: 3674000, // ~1h 1m claude time
  // Other metrics
  toolCalls: 1245,
  costs: {
    input: 156.4,
    output: 234.8,
    cacheWrite: 12.3,
    cacheRead: 9.0,
    total: 412.5,
    savings: 89.2,
  },
  // Quick stats
  busiestDay: { date: "Jan 15", sessions: 8 },
  longestSession: { duration: 2 * 60 * 60 * 1000, date: "Jan 12" }, // 2 hours
  // Mock sparkline data for trends
  sessionTrend: [12, 18, 15, 22, 19, 25, 20],
  timeTrend: [8, 12, 10, 15, 14, 18, 16],
  costTrend: [50, 120, 180, 250, 320, 380, 412],
  messageTrend: [45, 52, 48, 65, 58, 72, 68],
};

/** Hero metrics row - matches dashboard pattern */
function HeroMetricsRow({ sessions }: { sessions: Session[] }) {
  const totalSessionTime = calculateTotalSessionTime(sessions);
  const totalMessages = sessions.reduce((sum: number, s: Session) => sum + s.messageCount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <HeroMetricCard
        icon={Activity}
        title="Sessions"
        value={sessions.length.toString()}
        subtitle="total sessions"
        trend="up"
        trendValue="+12% vs lw"
        sparklineData={MOCK_DATA.sessionTrend}
        sparklineColor="#10b981"
      />
      <HeroMetricCard
        icon={Clock}
        title="Session Time"
        value={formatDuration(totalSessionTime)}
        subtitle="total duration"
        trend="up"
        trendValue="+8% vs lw"
        sparklineData={MOCK_DATA.timeTrend}
        sparklineColor="#3b82f6"
      />
      <HeroMetricCard
        icon={DollarSign}
        title="API Cost"
        value={`$${MOCK_DATA.costs.total.toFixed(2)}`}
        subtitle="estimated"
        trend="neutral"
        trendValue="$17/day"
        sparklineData={MOCK_DATA.costTrend}
        sparklineColor="#f59e0b"
      />
      <HeroMetricCard
        icon={MessageSquare}
        title="Messages"
        value={totalMessages.toLocaleString()}
        subtitle="total messages"
        trend="up"
        trendValue="+15%"
        sparklineData={MOCK_DATA.messageTrend}
        sparklineColor="#10b981"
        highlight
      />
    </div>
  );
}

/** Project metrics cards grid */
function ProjectMetrics({ project, sessions }: { project: Project; sessions: Session[] }) {
  const totalSessionTime = calculateTotalSessionTime(sessions);
  const avgSessionDuration = sessions.length > 0 ? totalSessionTime / sessions.length : 0;

  return (
    <>
      {/* Row 1: Hero Metrics */}
      <HeroMetricsRow sessions={sessions} />

      {/* Row 2: Time Breakdown (4), Cost Analysis (3), Quick Stats (3) */}
      {/* Below 1280px: 1 card on top, 2 cards below. Above 1280px: 3 cards with 4:3:3 ratio */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(500px,4fr)_3fr_3fr] gap-4 items-stretch">
        <div className="md:col-span-2 xl:col-span-1 h-full">
          <TimeBreakdownCard
            clockStart={project.firstActivity}
            clockEnd={project.lastActivity}
            rawSessionTime={MOCK_DATA.rawSessionTime}
            filteredSessionTime={MOCK_DATA.filteredSessionTime}
            humanTime={MOCK_DATA.humanTime}
            aiTime={MOCK_DATA.claudeTime}
          />
        </div>
        <CostAnalysisCard
          inputCost={MOCK_DATA.costs.input}
          outputCost={MOCK_DATA.costs.output}
          cacheWriteCost={MOCK_DATA.costs.cacheWrite}
          cacheReadCost={MOCK_DATA.costs.cacheRead}
          cacheSavings={MOCK_DATA.costs.savings}
        />
        <ProjectQuickStatsCard
          toolCalls={MOCK_DATA.toolCalls}
          busiestDay={MOCK_DATA.busiestDay}
          longestSession={MOCK_DATA.longestSession}
          avgSessionDuration={avgSessionDuration}
        />
      </div>
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
    <header className="flex items-start gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        aria-label="Back to projects"
        className="flex-shrink-0 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {mergedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              <GitMerge className="h-3 w-3" />
              {mergedCount} merged
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{project.path}</p>
      </div>
    </header>
  );
}

/** Sessions section with list or empty state */
function SessionsSection({ sessions }: { sessions: Session[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Recent Sessions</h2>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {sessions.length}
        </span>
      </div>
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

/** Current design content */
function CurrentDesign({
  project,
  mergedProjects,
  allSessions,
  onUnmerge,
}: {
  project: Project;
  mergedProjects: Project[];
  allSessions: Session[];
  onUnmerge: (path: string) => void;
}) {
  // Only show MergedProjectsCard when there are real merged projects
  const hasRealMergedProjects = mergedProjects.length > 0;

  return (
    <>
      <ProjectMetrics project={project} sessions={allSessions} />
      {hasRealMergedProjects && (
        <MergedProjectsCard mergedProjects={mergedProjects} onUnmerge={onUnmerge} />
      )}
      <SessionsSection sessions={allSessions} />
    </>
  );
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
      <CurrentDesign
        project={project}
        mergedProjects={mergedProjects}
        allSessions={allSessions}
        onUnmerge={handleUnmerge}
      />
    </div>
  );
}
