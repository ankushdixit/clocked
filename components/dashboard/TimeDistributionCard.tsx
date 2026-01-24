"use client";

import { useState } from "react";
import { PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/formatters/time";
import { generateEnhancedProjects } from "@/lib/mockData";
import type { Project } from "@/types/electron";

const PROJECT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];

interface TooltipData {
  name: string;
  totalTime: number;
  percentage: number;
  x: number;
  y: number;
}
interface PieSegment {
  name: string;
  path: string;
  totalTime: number;
  color: string;
  percentage: number;
  start: number;
}

function PieTooltip({ tooltip }: { tooltip: TooltipData }) {
  return (
    <div
      className="fixed z-50 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-md border pointer-events-none"
      style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
    >
      <div className="font-medium">{tooltip.name}</div>
      <div className="text-muted-foreground">
        {formatDuration(tooltip.totalTime)} ({tooltip.percentage.toFixed(1)}%)
      </div>
    </div>
  );
}

/** Calculate SVG arc path for pie segment */
function createArcPath(startAngle: number, endAngle: number, radius: number): string {
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);
  const x1 = 50 + radius * Math.cos(startRad),
    y1 = 50 + radius * Math.sin(startRad);
  const x2 = 50 + radius * Math.cos(endRad),
    y2 = 50 + radius * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/** Calculate label position for pie segment */
function getLabelPosition(startPercent: number, percentage: number) {
  const midAngle = ((startPercent + percentage / 2) / 100) * 360 - 90;
  const midRad = midAngle * (Math.PI / 180);
  return { x: 50 + 32 * Math.cos(midRad), y: 50 + 32 * Math.sin(midRad) };
}

/** Prepare and calculate pie segments from projects */
function prepareSegments(realProjects: Project[] | undefined): PieSegment[] {
  const mockProjects = generateEnhancedProjects();
  const projects =
    realProjects && realProjects.length > 0
      ? realProjects
          .filter((p) => !p.mergedInto && p.totalTime > 0)
          .sort((a, b) => b.totalTime - a.totalTime)
          .slice(0, 8)
          .map((p, i) => ({
            name: p.name,
            path: p.path,
            totalTime: p.totalTime,
            color: PROJECT_COLORS[i % PROJECT_COLORS.length],
          }))
      : mockProjects;
  const totalTime = projects.reduce((sum, p) => sum + p.totalTime, 0);
  let cumulative = 0;
  return projects.map((project) => {
    const percentage = (project.totalTime / totalTime) * 100;
    const start = cumulative;
    cumulative += percentage;
    return { ...project, percentage, start };
  });
}

export function TimeDistributionCard({ projects }: { projects?: Project[] }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const segments = prepareSegments(projects);

  const handleMouseEnter = (e: React.MouseEvent<SVGPathElement>, seg: PieSegment) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      name: seg.name,
      totalTime: seg.totalTime,
      percentage: seg.percentage,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <PieChart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Time Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end overflow-hidden">
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full max-w-[240px] h-auto">
            {segments.map((seg) => {
              const startAngle = (seg.start / 100) * 360,
                endAngle = ((seg.start + seg.percentage) / 100) * 360;
              const labelPos = getLabelPosition(seg.start, seg.percentage);
              return (
                <g key={seg.path}>
                  <path
                    d={createArcPath(startAngle, endAngle, 45)}
                    fill={seg.color}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onMouseEnter={(e) => handleMouseEnter(e, seg)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {seg.percentage >= 5 && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="5"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {seg.percentage.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}
            <circle cx="50" cy="50" r="22" className="fill-card" />
          </svg>
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-2">
          {segments.slice(0, 5).map((project) => (
            <div key={project.path} className="flex items-center gap-1 text-[12px]">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-muted-foreground">{project.name}</span>
            </div>
          ))}
        </div>
        {tooltip && <PieTooltip tooltip={tooltip} />}
      </CardContent>
    </Card>
  );
}
