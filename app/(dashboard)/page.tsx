"use client";

/**
 * Dashboard Page - Main Usage Dashboard
 *
 * Features:
 * - Hero metrics with responsive sparklines
 * - Today vs Daily Average + Claude Max Limits
 * - Activity patterns row (heatmap, hourly, cost trend)
 * - Top Projects + Time Distribution + Human:AI trend
 * - Quick Stats
 */

import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { mockSummary } from "@/lib/mockData";
import {
  ActivityHeatmap,
  HeroMetricsRow,
  TodayVsAverageCard,
  ClaudeMaxLimitsCard,
  QuickStatsCard,
  HourlyDistributionCard,
  CumulativeCostCard,
  TopProjectsCard,
  TimeDistributionCard,
  HumanAIRatioCard,
} from "@/components/dashboard";

export default function DashboardPage() {
  const currentMonth = format(new Date(), "MMMM yyyy");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{currentMonth}</span>
        </div>
      </div>

      {/* Section 1: Hero Metrics
          - xl+: 4 columns (1×4)
          - lg-xl: 4 columns with shorter text
          - md-lg: 2×2 grid
          - <md: 2×2 grid */}
      <HeroMetricsRow />

      {/* Section 2+3 Combined: Today, Claude, Quick Stats, Activity, Session, Cumulative
          - xl+: Row 1: Today, Claude, Quick Stats | Row 2: Activity, Session, Cumulative (6-col grid)
          - lg-xl: 2 equal columns
          - 936px-lg: 5-col grid with ratios - Row 1: 2:3 | Row 2: 3:2 | Row 3: 2:3
          - <936px: Today, Claude, Session, Cumulative full width; Quick Stats + Activity paired 3:2 */}
      <div className="grid grid-cols-5 lg:grid-cols-2 xl:grid-cols-6 gap-4">
        {/* Today - full width below 936px, 2:3 split at 936px-lg */}
        <div className="order-1 col-span-5 min-[936px]:col-span-2 lg:col-span-1 xl:col-span-2 [&>*]:h-full">
          <TodayVsAverageCard />
        </div>
        {/* Claude - full width below 936px, 2:3 split at 936px-lg */}
        <div className="order-2 col-span-5 min-[936px]:col-span-3 lg:col-span-1 xl:col-span-2 [&>*]:h-full">
          <ClaudeMaxLimitsCard />
        </div>
        {/* Quick Stats - full width below 640px, 3:2 split (3/5) at 640px-lg */}
        <div className="order-3 col-span-5 sm:col-span-3 lg:col-span-1 xl:col-span-2 [&>*]:h-full">
          <QuickStatsCard />
        </div>
        {/* Activity - full width below 640px, 3:2 split (2/5) at 640px-lg */}
        <div className="order-4 col-span-5 sm:col-span-2 lg:col-span-1 xl:col-span-1 [&>*]:h-full">
          <ActivityHeatmap dailyActivity={mockSummary.dailyActivity} month={new Date()} />
        </div>
        {/* Session Distribution - full width below 936px, 2:3 split at 936px-lg */}
        <div className="order-5 col-span-5 min-[936px]:col-span-2 lg:col-span-1 xl:col-span-2 [&>*]:h-full">
          <HourlyDistributionCard />
        </div>
        {/* Cumulative Cost - full width below 936px, 2:3 split at 936px-lg */}
        <div className="order-6 col-span-5 min-[936px]:col-span-3 lg:col-span-1 xl:col-span-3 [&>*]:h-full">
          <CumulativeCostCard />
        </div>
      </div>

      {/* Section 4: Projects & Time Insights
          - xl+: 5-3-7 columns ratio (Top Projects, Time Distribution, Human:AI)
          - 936px-xl: 2+1 (TopProjects+Time on row 1, Human:AI on row 2)
          - <936px: stacked (3×1) */}
      <div className="grid grid-cols-1 min-[936px]:grid-cols-2 xl:grid-cols-[5fr_3fr_7fr] gap-4">
        <div className="col-span-1">
          <TopProjectsCard />
        </div>
        <div className="col-span-1 [&>*]:h-full">
          <TimeDistributionCard />
        </div>
        <div className="min-[936px]:col-span-2 xl:col-span-1 [&>*]:h-full">
          <HumanAIRatioCard />
        </div>
      </div>
    </div>
  );
}
