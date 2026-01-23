"use client";

/**
 * Session Row Component
 *
 * Displays a single session with:
 * - Date/time of the session
 * - Summary or first prompt (truncated to 80 characters)
 * - Duration and message count
 */

import { format, isToday, isYesterday } from "date-fns";
import { ChevronRight } from "lucide-react";
import { formatDuration } from "@/lib/formatters/time";
import type { Session } from "@/types/electron";

interface SessionRowProps {
  session: Session;
  onClick?: () => void;
}

/** Format date with relative labels for today/yesterday */
function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);

  if (isToday(date)) {
    return `Today, ${format(date, "h:mm a")}`;
  }

  if (isYesterday(date)) {
    return `Yesterday, ${format(date, "h:mm a")}`;
  }

  return format(date, "MMM d, h:mm a");
}

/** Truncate text to specified length with ellipsis */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

export function SessionRow({ session, onClick }: SessionRowProps) {
  const displayText = session.summary || session.firstPrompt || "No description";
  const truncated = truncateText(displayText, 80);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    // Session detail navigation is a placeholder until Story 4.3
  };

  return (
    <div
      onClick={handleClick}
      className="group flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-xs text-muted-foreground mb-1">{formatSessionDate(session.created)}</p>
        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {truncated}
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
        <span className="tabular-nums">{formatDuration(session.duration)}</span>
        <span className="tabular-nums">{session.messageCount} messages</span>
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
