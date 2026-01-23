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

/**
 * Format a date to a relative "last activity" string
 * @param lastActivity - ISO date string
 * @returns Formatted string like "Today", "Yesterday", "3d ago", "2w ago", or "Jan 15"
 */
export function formatLastActivity(lastActivity: string): string {
  const date = new Date(lastActivity);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
