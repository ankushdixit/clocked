"use client";

import { MetricCard } from "./MetricCard";
import { formatDuration } from "@/lib/formatters/time";
import {
  formatCost,
  formatMultiplier,
  calculateValueMultiplier,
  calculateTimeRatio,
} from "@/lib/calculators/usage-calculator";
import type { MonthlySummary } from "@/types/electron";

export interface MetricsGridProps {
  summary: MonthlySummary;
  subscriptionCost?: number;
}

export function MetricsGrid({ summary, subscriptionCost = 100 }: MetricsGridProps) {
  const valueMultiplier = calculateValueMultiplier(summary.estimatedApiCost, subscriptionCost);
  const { humanPercentage, claudePercentage } = calculateTimeRatio(
    summary.humanTime,
    summary.claudeTime
  );

  // Determine if human/AI ratio has data
  const hasTimeRatio = summary.humanTime > 0 || summary.claudeTime > 0;
  const timeRatioDisplay = hasTimeRatio ? `${humanPercentage}% / ${claudePercentage}%` : "\u2014"; // em dash for placeholder

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        title="Sessions"
        value={summary.totalSessions.toLocaleString()}
        subtitle="this month"
      />
      <MetricCard
        title="Session Time"
        value={formatDuration(summary.totalActiveTime)}
        subtitle="total duration"
      />
      <MetricCard
        title="API Cost"
        value={formatCost(summary.estimatedApiCost)}
        subtitle="estimated"
      />
      <MetricCard title="Subscription" value={formatCost(subscriptionCost)} subtitle="Max (US)" />
      <MetricCard
        title="Value"
        value={formatMultiplier(valueMultiplier)}
        subtitle="multiplier"
        highlight={valueMultiplier > 1}
      />
      <MetricCard title="Human : AI" value={timeRatioDisplay} subtitle="time split" />
    </div>
  );
}
