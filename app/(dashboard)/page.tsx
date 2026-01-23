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
  return (
    <div className="space-y-6">
      {/* Section 1: Hero Metrics
          - xl+: 4 columns (1×4)
          - lg-xl: 4 columns with shorter text
          - md-lg: 2×2 grid
          - <md: 2×2 grid */}
      <HeroMetricsRow />

      {/* Section 2: Today's Focus + Claude Max Limits + Quick Stats
          - lg+: 3 columns (1×3)
          - <lg: stacked (3×1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TodayVsAverageCard />
        <ClaudeMaxLimitsCard />
        <QuickStatsCard />
      </div>

      {/* Section 3: Activity Patterns
          - lg+: 1-2-3 columns ratio (Activity, Session Distribution, Cumulative Cost)
          - md-lg: 2+1 (Activity+Session on row 1, Cumulative on row 2)
          - <md: stacked (3×1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="md:col-span-1 lg:col-span-1">
          <ActivityHeatmap dailyActivity={mockSummary.dailyActivity} month={new Date()} />
        </div>
        <div className="md:col-span-1 lg:col-span-2 [&>*]:h-full">
          <HourlyDistributionCard />
        </div>
        <div className="md:col-span-2 lg:col-span-3 [&>*]:h-full">
          <CumulativeCostCard />
        </div>
      </div>

      {/* Section 4: Projects & Time Insights
          - lg+: 5-3-7 columns ratio (Top Projects, Time Distribution, Human:AI)
          - md-lg: 2+1 (TopProjects+Time on row 1, Human:AI on row 2)
          - <md: stacked (3×1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[5fr_3fr_7fr] gap-4">
        <div className="md:col-span-1 lg:col-span-1">
          <TopProjectsCard />
        </div>
        <div className="md:col-span-1 lg:col-span-1 [&>*]:h-full">
          <TimeDistributionCard />
        </div>
        <div className="md:col-span-2 lg:col-span-1 [&>*]:h-full">
          <HumanAIRatioCard />
        </div>
      </div>
    </div>
  );
}
