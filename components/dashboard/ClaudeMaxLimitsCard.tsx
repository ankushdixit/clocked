"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClaudeMaxLimitsCard() {
  // Mock data for Claude Max limits (based on actual Claude limits UI)
  const limits = [
    {
      id: "session",
      label: "Session",
      percentage: 1,
      resetInfo: "Resets 2pm",
      gradient: "url(#sessionGradient)",
    },
    {
      id: "weekly",
      label: "Weekly",
      percentage: 62,
      resetInfo: "Resets Jan 25, 4pm",
      gradient: "url(#weeklyGradient)",
    },
    {
      id: "sonnet",
      label: "Sonnet",
      percentage: 0,
      resetInfo: "Resets Jan 25, 4pm",
      gradient: "url(#sonnetGradient)",
    },
  ];

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Claude Max Limits</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center overflow-hidden">
        <svg className="absolute" width="0" height="0">
          <defs>
            <linearGradient id="sessionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="weeklyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="sonnetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex items-start justify-evenly w-full min-w-0 gap-2">
          {limits.map((limit) => (
            <div key={limit.id} className="flex flex-col items-center min-w-0 flex-1">
              {/* Responsive circle sizes: smaller on md, larger on xl */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-28 xl:h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-muted"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={limit.percentage > 80 ? "#ef4444" : limit.gradient}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${limit.percentage * 2.64} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base sm:text-lg md:text-base lg:text-lg xl:text-2xl font-bold">
                    {limit.percentage}%
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium mt-1 truncate max-w-full">{limit.label}</p>
              <p className="text-[10px] text-muted-foreground text-center truncate max-w-full">
                {limit.resetInfo}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
