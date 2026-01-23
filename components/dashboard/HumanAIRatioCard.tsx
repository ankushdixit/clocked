"use client";

import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HumanAIRatioCard() {
  // Mock data for human:AI ratio over time (14 days)
  const ratioTrend = [
    { day: 1, date: "Jan 1", human: 45, ai: 55 },
    { day: 2, date: "Jan 2", human: 42, ai: 58 },
    { day: 3, date: "Jan 3", human: 48, ai: 52 },
    { day: 4, date: "Jan 4", human: 40, ai: 60 },
    { day: 5, date: "Jan 5", human: 38, ai: 62 },
    { day: 6, date: "Jan 6", human: 35, ai: 65 },
    { day: 7, date: "Jan 7", human: 32, ai: 68 },
    { day: 8, date: "Jan 8", human: 30, ai: 70 },
    { day: 9, date: "Jan 9", human: 35, ai: 65 },
    { day: 10, date: "Jan 10", human: 33, ai: 67 },
    { day: 11, date: "Jan 11", human: 30, ai: 70 },
    { day: 12, date: "Jan 12", human: 28, ai: 72 },
    { day: 13, date: "Jan 13", human: 32, ai: 68 },
    { day: 14, date: "Jan 14", human: 30, ai: 70 },
  ];

  const currentHuman = ratioTrend[ratioTrend.length - 1].human;
  const currentAI = ratioTrend[ratioTrend.length - 1].ai;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Human : AI Ratio
          </CardTitle>
          {/* Legend at top */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Human {currentHuman}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-xs text-muted-foreground">AI {currentAI}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end overflow-hidden">
        {/* Chart with Y-axis on both sides */}
        <div className="flex overflow-hidden">
          {/* Left Y-axis */}
          <div className="flex flex-col justify-between text-[10px] text-muted-foreground pr-2 w-8 text-right h-52">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>

          {/* Chart area */}
          <div className="flex-1 flex flex-col">
            <svg className="w-full h-64" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid line at 50% */}
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="2"
              />

              {/* AI area (bottom - larger portion, indigo) */}
              <path
                d={`M 0,100 ${ratioTrend
                  .map((d, i) => {
                    const x = (i / (ratioTrend.length - 1)) * 100;
                    const y = d.human; // AI fills from bottom, human% from top
                    return `L ${x},${y}`;
                  })
                  .join(" ")} L 100,100 Z`}
                fill="rgba(99, 102, 241, 0.5)"
              />
              {/* Human area (top - smaller portion, green) */}
              <path
                d={`M 0,0 ${ratioTrend
                  .map((d, i) => {
                    const x = (i / (ratioTrend.length - 1)) * 100;
                    const y = d.human; // Human fills from top to human%
                    return `L ${x},${y}`;
                  })
                  .join(" ")} L 100,0 Z`}
                fill="rgba(16, 185, 129, 0.5)"
              />
              {/* Dividing line */}
              <polyline
                points={ratioTrend
                  .map((d, i) => {
                    const x = (i / (ratioTrend.length - 1)) * 100;
                    const y = d.human;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
            </svg>

            {/* X-axis dates */}
            <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
              <span>{ratioTrend[0].date}</span>
              <span>{ratioTrend[Math.floor(ratioTrend.length / 2)].date}</span>
              <span>{ratioTrend[ratioTrend.length - 1].date}</span>
            </div>
          </div>

          {/* Right Y-axis */}
          <div className="flex flex-col justify-between text-[10px] text-muted-foreground pl-2 w-8 text-left h-52">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
