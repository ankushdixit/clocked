"use client";

/**
 * Sessions List Component
 *
 * Displays a 2-column grid of session cards for a project.
 * Each session shows date/time, summary, duration, and message count.
 * Cards are clickable with hover effects (Visual Story design).
 */

import { SessionRow } from "./SessionRow";
import type { Session } from "@/types/electron";

interface SessionsListProps {
  sessions: Session[];
}

export function SessionsList({ sessions }: SessionsListProps) {
  return (
    <div
      data-testid="sessions-list"
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(600px, 1fr))" }}
    >
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} />
      ))}
    </div>
  );
}
