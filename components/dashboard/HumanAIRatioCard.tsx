"use client";

import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

type RatioDataPoint = (typeof ratioTrend)[number];

function generateAreaPath(data: RatioDataPoint[], fromTop: boolean): string {
  const startY = fromTop ? 0 : 100;
  const endY = fromTop ? 0 : 100;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = d.human;
      return `L ${x},${y}`;
    })
    .join(" ");
  return `M 0,${startY} ${points} L 100,${endY} Z`;
}

function generateDividingLinePoints(data: RatioDataPoint[]): string {
  return data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = d.human;
      return `${x},${y}`;
    })
    .join(" ");
}

function Legend({ humanPercent, aiPercent }: { humanPercent: number; aiPercent: number }) {
  return (
    <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Human {humanPercent}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">AI {aiPercent}%</span>
      </div>
    </div>
  );
}

function YAxis({ align }: { align: "left" | "right" }) {
  const alignClass = align === "left" ? "pr-2 text-right" : "pl-2 text-left";
  return (
    <div
      className={`flex flex-col justify-between text-[10px] text-muted-foreground ${alignClass} w-8 h-40 sm:h-52 flex-shrink-0`}
    >
      <span>100%</span>
      <span>50%</span>
      <span>0%</span>
    </div>
  );
}

function RatioChart({ data }: { data: RatioDataPoint[] }) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <svg className="w-full h-40 sm:h-52 lg:h-64" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeDasharray="2"
        />
        <path d={generateAreaPath(data, false)} fill="rgba(99, 102, 241, 0.5)" />
        <path d={generateAreaPath(data, true)} fill="rgba(16, 185, 129, 0.5)" />
        <polyline
          points={generateDividingLinePoints(data)}
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
        <span>{data[0].date}</span>
        <span className="hidden sm:inline">{data[Math.floor(data.length / 2)].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

export function HumanAIRatioCard() {
  const currentHuman = ratioTrend[ratioTrend.length - 1].human;
  const currentAI = ratioTrend[ratioTrend.length - 1].ai;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2 flex-shrink-0">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Human : AI Ratio</span>
          </CardTitle>
          <Legend humanPercent={currentHuman} aiPercent={currentAI} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end overflow-hidden min-w-0">
        <div className="flex overflow-hidden min-w-0">
          <YAxis align="left" />
          <RatioChart data={ratioTrend} />
          <YAxis align="right" />
        </div>
      </CardContent>
    </Card>
  );
}
