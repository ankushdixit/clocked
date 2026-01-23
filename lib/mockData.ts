/**
 * Mock data for dashboard mockups
 * Uses realistic data similar to the screenshot
 */

import { MonthlySummary, DailyActivity, ProjectSummary } from "@/types/electron";

// Generate daily activity for January 2026
function generateDailyActivity(): DailyActivity[] {
  const activities: DailyActivity[] = [];
  const sessionCounts = [
    12,
    15,
    8,
    0,
    14,
    18,
    22, // Week 1
    10,
    16,
    20,
    14,
    12,
    8,
    5, // Week 2
    18,
    22,
    15,
    17,
    20,
    12,
    0, // Week 3
    14,
    16,
    18, // Current week (partial)
  ];

  for (let i = 0; i < sessionCounts.length; i++) {
    const day = i + 1;
    const count = sessionCounts[i];
    activities.push({
      date: `2026-01-${day.toString().padStart(2, "0")}`,
      sessionCount: count,
      totalTime: count * 8500 + Math.random() * 3000, // ~2-3 hours per session avg
    });
  }

  return activities;
}

// Generate hourly distribution (when sessions typically start)
export function generateHourlyDistribution(): { hour: number; sessions: number }[] {
  return [
    { hour: 0, sessions: 2 },
    { hour: 1, sessions: 1 },
    { hour: 2, sessions: 0 },
    { hour: 3, sessions: 0 },
    { hour: 4, sessions: 1 },
    { hour: 5, sessions: 3 },
    { hour: 6, sessions: 8 },
    { hour: 7, sessions: 15 },
    { hour: 8, sessions: 28 },
    { hour: 9, sessions: 42 },
    { hour: 10, sessions: 38 },
    { hour: 11, sessions: 35 },
    { hour: 12, sessions: 22 },
    { hour: 13, sessions: 30 },
    { hour: 14, sessions: 45 },
    { hour: 15, sessions: 40 },
    { hour: 16, sessions: 32 },
    { hour: 17, sessions: 25 },
    { hour: 18, sessions: 18 },
    { hour: 19, sessions: 12 },
    { hour: 20, sessions: 8 },
    { hour: 21, sessions: 5 },
    { hour: 22, sessions: 3 },
    { hour: 23, sessions: 2 },
  ];
}

// Generate daily cost trend
export function generateCostTrend(): { date: string; cost: number; cumulative: number }[] {
  const trend: { date: string; cost: number; cumulative: number }[] = [];
  let cumulative = 0;
  const dailyCosts = [
    85, 92, 78, 0, 88, 105, 120, 95, 110, 125, 98, 88, 72, 45, 115, 135, 105, 118, 130, 95, 0, 102,
    118, 128,
  ];

  for (let i = 0; i < dailyCosts.length; i++) {
    const day = i + 1;
    cumulative += dailyCosts[i];
    trend.push({
      date: `2026-01-${day.toString().padStart(2, "0")}`,
      cost: dailyCosts[i],
      cumulative,
    });
  }

  return trend;
}

// Recent sessions for dense view
export interface RecentSession {
  id: string;
  project: string;
  startTime: string;
  duration: number;
  cost: number;
  messageCount: number;
}

export function generateRecentSessions(): RecentSession[] {
  return [
    {
      id: "1",
      project: "raincheck",
      startTime: "2026-01-23T14:32:00",
      duration: 7200,
      cost: 42.5,
      messageCount: 156,
    },
    {
      id: "2",
      project: "www",
      startTime: "2026-01-23T11:15:00",
      duration: 5400,
      cost: 28.3,
      messageCount: 98,
    },
    {
      id: "3",
      project: "raincheck",
      startTime: "2026-01-23T09:00:00",
      duration: 3600,
      cost: 18.75,
      messageCount: 67,
    },
    {
      id: "4",
      project: "windup",
      startTime: "2026-01-22T16:45:00",
      duration: 9000,
      cost: 55.2,
      messageCount: 203,
    },
    {
      id: "5",
      project: "cosy",
      startTime: "2026-01-22T14:00:00",
      duration: 4500,
      cost: 22.1,
      messageCount: 82,
    },
    {
      id: "6",
      project: "validate-this-idea",
      startTime: "2026-01-22T10:30:00",
      duration: 6300,
      cost: 35.8,
      messageCount: 124,
    },
    {
      id: "7",
      project: "www",
      startTime: "2026-01-21T15:20:00",
      duration: 7800,
      cost: 48.9,
      messageCount: 178,
    },
    {
      id: "8",
      project: "raincheck",
      startTime: "2026-01-21T09:45:00",
      duration: 5100,
      cost: 31.25,
      messageCount: 112,
    },
  ];
}

// Quick stats
export interface QuickStats {
  busiestDay: { date: string; sessions: number };
  longestSession: { project: string; duration: number };
  mostActiveProject: string;
  avgSessionLength: number;
  avgDailySessions: number;
  peakHour: number;
  totalMessages: number;
  avgCostPerSession: number;
}

export function generateQuickStats(): QuickStats {
  return {
    busiestDay: { date: "2026-01-07", sessions: 22 },
    longestSession: { project: "raincheck", duration: 14400 }, // 4 hours
    mostActiveProject: "www",
    avgSessionLength: 8658, // ~2h 24m
    avgDailySessions: 14.5,
    peakHour: 14, // 2 PM
    totalMessages: 4872,
    avgCostPerSession: 7.26,
  };
}

// Daily comparison (today vs average)
export interface DailyComparison {
  today: { sessions: number; time: number; cost: number };
  average: { sessions: number; time: number; cost: number };
}

export function generateDailyComparison(): DailyComparison {
  return {
    today: { sessions: 8, time: 21600, cost: 89.55 },
    average: { sessions: 14.5, time: 32400, cost: 105.54 },
  };
}

// Top projects with additional data
export interface EnhancedProject extends ProjectSummary {
  weeklyTrend: number[]; // Last 7 days session counts
  color: string;
}

export function generateEnhancedProjects(): EnhancedProject[] {
  return [
    {
      name: "raincheck",
      path: "/Users/ankush/Projects/raincheck",
      sessionCount: 26,
      totalTime: 972420, // 270h 7m
      estimatedCost: 810.38,
      weeklyTrend: [4, 3, 5, 2, 4, 5, 3],
      color: "#10b981",
    },
    {
      name: "www",
      path: "/Users/ankush/Projects/www",
      sessionCount: 145,
      totalTime: 755640, // 209h 54m
      estimatedCost: 629.73,
      weeklyTrend: [8, 12, 10, 15, 9, 11, 8],
      color: "#3b82f6",
    },
    {
      name: "windup",
      path: "/Users/ankush/Projects/windup",
      sessionCount: 9,
      totalTime: 377160, // 104h 46m
      estimatedCost: 314.31,
      weeklyTrend: [1, 2, 1, 0, 2, 1, 2],
      color: "#8b5cf6",
    },
    {
      name: "validate-this-idea",
      path: "/Users/ankush/Projects/validate-this-idea",
      sessionCount: 6,
      totalTime: 176160, // 48h 56m
      estimatedCost: 146.81,
      weeklyTrend: [0, 1, 1, 2, 1, 0, 1],
      color: "#f59e0b",
    },
    {
      name: "cosy",
      path: "/Users/ankush/Projects/cosy",
      sessionCount: 39,
      totalTime: 173400, // 48h 10m
      estimatedCost: 144.55,
      weeklyTrend: [3, 5, 4, 6, 5, 4, 3],
      color: "#ec4899",
    },
  ];
}

// Main mock summary
export const mockSummary: MonthlySummary = {
  month: "2026-01",
  totalSessions: 349,
  totalActiveTime: 3039480000, // 844h 18m in milliseconds
  estimatedApiCost: 2532.92,
  humanTime: 0,
  claudeTime: 0,
  dailyActivity: generateDailyActivity(),
  topProjects: [
    {
      name: "raincheck",
      path: "/Users/ankush/Projects/raincheck",
      sessionCount: 26,
      totalTime: 972420,
      estimatedCost: 810.38,
    },
    {
      name: "www",
      path: "/Users/ankush/Projects/www",
      sessionCount: 145,
      totalTime: 755640,
      estimatedCost: 629.73,
    },
    {
      name: "windup",
      path: "/Users/ankush/Projects/windup",
      sessionCount: 9,
      totalTime: 377160,
      estimatedCost: 314.31,
    },
    {
      name: "validate-this-idea",
      path: "/Users/ankush/Projects/validate-this-idea",
      sessionCount: 6,
      totalTime: 176160,
      estimatedCost: 146.81,
    },
    {
      name: "cosy",
      path: "/Users/ankush/Projects/cosy",
      sessionCount: 39,
      totalTime: 173400,
      estimatedCost: 144.55,
    },
  ],
};
