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
      {/* Section 1: Hero Metrics */}
      <HeroMetricsRow />

      {/* Section 2: Today's Focus + Claude Max Limits + Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TodayVsAverageCard />
        <ClaudeMaxLimitsCard />
        <QuickStatsCard />
      </div>

      {/* Section 3: Activity Patterns - cards stretch to match tallest */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-1">
          <ActivityHeatmap dailyActivity={mockSummary.dailyActivity} month={new Date()} />
        </div>
        <div className="md:col-span-2 [&>*]:h-full">
          <HourlyDistributionCard />
        </div>
        <div className="md:col-span-3 [&>*]:h-full">
          <CumulativeCostCard />
        </div>
      </div>

      {/* Section 4: Projects & Time Insights - height determined by Top Projects */}
      <div className="grid grid-cols-1 md:grid-cols-[5fr_3fr_7fr] gap-4">
        <div>
          <TopProjectsCard />
        </div>
        <div className="[&>*]:h-full">
          <TimeDistributionCard />
        </div>
        <div className="[&>*]:h-full">
          <HumanAIRatioCard />
        </div>
      </div>
    </div>
  );
}
