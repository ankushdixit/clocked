"use client";

/**
 * Sessions List Component
 *
 * Displays a 2-column grid of session cards for a project.
 * Each session shows date/time, summary, duration, and message count.
 * Cards are clickable with hover effects (Visual Story design).
 * Clicking a session resumes it in the user's preferred IDE.
 */

import { SessionRow } from "./SessionRow";
import type { Session } from "@/types/electron";

interface SessionsListProps {
  sessions: Session[];
  projectPath: string;
  onResumeSession?: (sessionId: string, projectPath: string) => void;
  loadingSessionId?: string | null;
}

export function SessionsList({
  sessions,
  projectPath,
  onResumeSession,
  loadingSessionId,
}: SessionsListProps) {
  const handleSessionClick = (session: Session) => {
    if (onResumeSession) {
      onResumeSession(session.id, projectPath);
    }
  };

  return (
    <div
      data-testid="sessions-list"
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(600px, 1fr))" }}
    >
      {sessions.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          onClick={() => handleSessionClick(session)}
          isLoading={loadingSessionId === session.id}
        />
      ))}
    </div>
  );
}
