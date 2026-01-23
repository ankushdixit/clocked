"use client";

import { Activity, Clock, DollarSign, TrendingUp } from "lucide-react";
import { HeroMetricCard } from "./HeroMetricCard";
import { mockSummary, generateCostTrend } from "@/lib/mockData";

export function HeroMetricsRow() {
  const dailySessionCounts = mockSummary.dailyActivity.map((d) => d.sessionCount);
  const dailyTimes = mockSummary.dailyActivity.map((d) => d.totalTime / 3600000); // hours
  const costTrend = generateCostTrend();

  // Mock daily value multiplier trend (cost savings per day)
  const valueMultiplierTrend = costTrend.map((d) => d.cumulative / 100); // relative to $100 subscription

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <HeroMetricCard
        icon={Activity}
        title="Sessions"
        value="349"
        subtitle="this month"
        trend="up"
        trendValue="+12% vs last week"
        sparklineData={dailySessionCounts}
        sparklineColor="#10b981"
      />
      <HeroMetricCard
        icon={Clock}
        title="Session Time"
        value="844h 18m"
        subtitle="total duration"
        trend="up"
        trendValue="+8% vs last week"
        sparklineData={dailyTimes}
        sparklineColor="#3b82f6"
      />
      <HeroMetricCard
        icon={DollarSign}
        title="API Cost"
        value="$2,532.92"
        subtitle="estimated"
        trend="neutral"
        trendValue="$110/day avg"
        sparklineData={costTrend.map((d) => d.cumulative)}
        sparklineColor="#f59e0b"
      />
      <HeroMetricCard
        icon={TrendingUp}
        title="Value"
        value="25.33x"
        subtitle="multiplier"
        trend="up"
        trendValue="+14% vs last month"
        sparklineData={valueMultiplierTrend}
        sparklineColor="#10b981"
        highlight
      />
    </div>
  );
}
