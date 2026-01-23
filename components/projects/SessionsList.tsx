"use client";

/**
 * Sessions List Component
 *
 * Displays a list of sessions for a project, sorted by date (most recent first).
 * Each session shows date/time, summary or first prompt, duration, and message count.
 */

import { SessionRow } from "./SessionRow";
import type { Session } from "@/types/electron";

interface SessionsListProps {
  sessions: Session[];
}

export function SessionsList({ sessions }: SessionsListProps) {
  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} />
      ))}
    </div>
  );
}
