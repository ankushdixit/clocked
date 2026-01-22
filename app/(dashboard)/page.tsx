"use client";

import { useEffect, useState } from "react";
import { format, endOfMonth, differenceInDays } from "date-fns";
import { Loader2 } from "lucide-react";
import { UsageMeter } from "@/components/dashboard/UsageMeter";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { TopProjects } from "@/components/dashboard/TopProjects";
import { calculateUsagePercentage } from "@/lib/calculators/usage-calculator";
import type { MonthlySummary, MonthlySummaryResponse } from "@/types/electron";

interface DashboardState {
  summary: MonthlySummary | null;
  loading: boolean;
  error: string | null;
}

function useMonthlySummary(): DashboardState {
  const [state, setState] = useState<DashboardState>({
    summary: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchMonthlySummary() {
      if (typeof window !== "undefined" && window.electron) {
        try {
          const currentMonth = format(new Date(), "yyyy-MM");
          const response = (await window.electron.analytics.getMonthlySummary(
            currentMonth
          )) as MonthlySummaryResponse;

          if (response.error) {
            setState({ summary: null, loading: false, error: response.error });
          } else {
            setState({ summary: response.summary ?? null, loading: false, error: null });
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : "Failed to load data";
          setState({ summary: null, loading: false, error });
        }
      } else {
        // Not running in Electron - show placeholder state
        setState({
          summary: null,
          loading: false,
          error: "Running in browser mode - connect via Electron for live data",
        });
      }
    }

    fetchMonthlySummary();
  }, []);

  return state;
}

export default function DashboardPage() {
  const { summary, loading, error } = useMonthlySummary();

  const currentDate = new Date();
  const monthHeader = format(currentDate, "MMMM yyyy").toUpperCase();
  const daysRemaining = differenceInDays(endOfMonth(currentDate), currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">{monthHeader} USAGE</h1>
        </header>
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            {error || "No usage data available for this month"}
          </p>
        </div>
      </div>
    );
  }

  const usagePercentage = calculateUsagePercentage(summary.estimatedApiCost);

  return (
    <div className="space-y-6">
      {/* Header with month and usage meter */}
      <header className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">{monthHeader} USAGE</h1>
        <UsageMeter percentage={usagePercentage} daysRemaining={daysRemaining} />
      </header>

      {/* Metrics Grid - 6 cards */}
      <MetricsGrid summary={summary} />

      {/* Activity heatmap and Top Projects side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityHeatmap dailyActivity={summary.dailyActivity} month={currentDate} />
        <TopProjects projects={summary.topProjects} />
      </div>
    </div>
  );
}
