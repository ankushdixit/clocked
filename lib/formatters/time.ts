/**
 * Time formatting utilities for displaying durations
 */

/**
 * Format a duration in milliseconds to a human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "15h 30m" or "45m"
 */
export function formatDuration(ms: number): string {
  if (ms < 0) {
    return "0m";
  }

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}
