/**
 * Project activity utilities
 */

import type { Project } from "@/types/electron";

/**
 * Generate mock 7-day activity data based on project stats
 * Uses a deterministic hash so the same project always gets the same sparkline
 */
export function generateActivityData(project: Project): number[] {
  const hash = project.path.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = hash % 100;
  const baseLevel = Math.min(project.sessionCount / 10, 5);

  return Array.from({ length: 7 }, (_, i) => {
    const dayFactor = ((seed + i * 17) % 10) / 10;
    const recencyBoost = i === 6 ? 1.5 : i === 5 ? 1.2 : 1;
    return Math.floor(baseLevel * dayFactor * recencyBoost * 3);
  });
}
