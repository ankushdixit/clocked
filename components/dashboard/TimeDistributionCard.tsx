"use client";

import { PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateEnhancedProjects } from "@/lib/mockData";

export function TimeDistributionCard() {
  const projects = generateEnhancedProjects();
  const totalTime = projects.reduce((sum, p) => sum + p.totalTime, 0);

  // Calculate segments for pie chart
  let cumulativePercentage = 0;
  const segments = projects.map((project) => {
    const percentage = (project.totalTime / totalTime) * 100;
    const start = cumulativePercentage;
    cumulativePercentage += percentage;
    return { ...project, percentage, start };
  });

  // Calculate SVG arc paths for pie segments with labels
  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  // Calculate label position for each segment
  const getLabelPosition = (startPercent: number, percentage: number) => {
    const midAngle = ((startPercent + percentage / 2) / 100) * 360 - 90;
    const midRad = midAngle * (Math.PI / 180);
    const labelRadius = 32; // Position label at this radius
    return {
      x: 50 + labelRadius * Math.cos(midRad),
      y: 50 + labelRadius * Math.sin(midRad),
    };
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
        {/* Large Pie chart with labels inside */}
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full max-w-[240px] h-auto">
            {segments.map((seg) => {
              const startAngle = (seg.start / 100) * 360;
              const endAngle = ((seg.start + seg.percentage) / 100) * 360;
              const labelPos = getLabelPosition(seg.start, seg.percentage);

              return (
                <g key={seg.path}>
                  <path d={createArcPath(startAngle, endAngle, 45)} fill={seg.color} />
                  {seg.percentage >= 5 && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="5"
                      fontWeight="bold"
                    >
                      {seg.percentage.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}
            {/* Center hole for donut shape */}
            <circle cx="50" cy="50" r="22" className="fill-card" />
          </svg>
        </div>

        {/* Legend at bottom */}
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
      </CardContent>
    </Card>
  );
}
