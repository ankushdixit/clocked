"use client";

/**
 * Session Row Component
 *
 * Displays a single session as a card with:
 * - Date/time of the session
 * - Summary or first prompt
 * - Duration and message count with icons
 * - Hover effects and clickable to resume session
 */

import { format, isToday, isYesterday } from "date-fns";
import { Clock, MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { formatDuration } from "@/lib/formatters/time";
import type { Session } from "@/types/electron";

interface SessionRowProps {
  session: Session;
  onClick?: () => void;
  isLoading?: boolean;
}

/** Format date with relative labels for today/yesterday */
function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);

  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }

  return `${format(date, "MMM d")} at ${format(date, "h:mm a")}`;
}

export function SessionRow({ session, onClick, isLoading }: SessionRowProps) {
  const displayText = session.summary || session.firstPrompt || "No description";

  const handleClick = () => {
    if (onClick && !isLoading) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group p-4 rounded-xl border bg-card transition-all ${
        isLoading
          ? "opacity-70 cursor-wait"
          : "hover:shadow-md cursor-pointer hover:border-primary/50"
      }`}
      role="button"
      tabIndex={isLoading ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isLoading) {
          handleClick();
        }
      }}
      data-testid={`session-${session.id}`}
      aria-busy={isLoading}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{formatSessionDate(session.created)}</p>
          <p className="font-medium text-sm mt-1 line-clamp-2 group-hover:text-primary transition-colors">
            {displayText}
          </p>
        </div>
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0 mt-0.5" />
        ) : (
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
        )}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(session.duration)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {session.messageCount} messages
        </span>
        {isLoading && <span className="text-primary">Opening IDE...</span>}
      </div>
    </div>
  );
}
