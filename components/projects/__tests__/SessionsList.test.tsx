/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionsList } from "../SessionsList";
import type { Session } from "@/types/electron";

// Mock the SessionRow component with proper prop capture
jest.mock("../SessionRow", () => ({
  SessionRow: ({
    session,
    onClick,
    isLoading,
  }: {
    session: Session;
    onClick?: () => void;
    isLoading?: boolean;
  }) => (
    <div
      data-testid={`session-row-${session.id}`}
      data-loading={isLoading ? "true" : "false"}
      onClick={onClick}
      role="button"
    >
      {session.summary || session.firstPrompt}
    </div>
  ),
}));

const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: "session-1",
  projectPath: "/Users/test/my-project",
  created: "2024-01-10T10:00:00Z",
  modified: "2024-01-10T11:00:00Z",
  duration: 3600000,
  messageCount: 50,
  summary: "Test session",
  firstPrompt: "Hello",
  gitBranch: "main",
  ...overrides,
});

const defaultProjectPath = "/Users/test/my-project";

describe("SessionsList", () => {
  describe("Rendering", () => {
    it("renders all sessions", () => {
      const sessions = [
        createMockSession({ id: "session-1", summary: "First session" }),
        createMockSession({ id: "session-2", summary: "Second session" }),
        createMockSession({ id: "session-3", summary: "Third session" }),
      ];

      render(<SessionsList sessions={sessions} projectPath={defaultProjectPath} />);

      expect(screen.getByTestId("session-row-session-1")).toBeInTheDocument();
      expect(screen.getByTestId("session-row-session-2")).toBeInTheDocument();
      expect(screen.getByTestId("session-row-session-3")).toBeInTheDocument();
    });

    it("renders sessions in the order provided", () => {
      const sessions = [
        createMockSession({ id: "session-a", summary: "A" }),
        createMockSession({ id: "session-b", summary: "B" }),
        createMockSession({ id: "session-c", summary: "C" }),
      ];

      render(<SessionsList sessions={sessions} projectPath={defaultProjectPath} />);

      const rows = screen.getAllByTestId(/session-row-/);
      expect(rows[0]).toHaveTextContent("A");
      expect(rows[1]).toHaveTextContent("B");
      expect(rows[2]).toHaveTextContent("C");
    });

    it("renders empty list when no sessions provided", () => {
      const { container } = render(<SessionsList sessions={[]} projectPath={defaultProjectPath} />);

      // The container should be empty except for the wrapper div
      expect(container.querySelectorAll('[data-testid^="session-row-"]').length).toBe(0);
    });

    it("uses session id as key for each row", () => {
      const sessions = [
        createMockSession({ id: "unique-id-1" }),
        createMockSession({ id: "unique-id-2" }),
      ];

      render(<SessionsList sessions={sessions} projectPath={defaultProjectPath} />);

      expect(screen.getByTestId("session-row-unique-id-1")).toBeInTheDocument();
      expect(screen.getByTestId("session-row-unique-id-2")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies grid layout with gap for sessions", () => {
      const sessions = [createMockSession({ id: "session-1" })];

      const { container } = render(
        <SessionsList sessions={sessions} projectPath={defaultProjectPath} />
      );

      expect(container.firstChild).toHaveClass("grid");
      expect(container.firstChild).toHaveClass("gap-3");
    });
  });

  describe("Session data passing", () => {
    it("passes session data to SessionRow component", () => {
      const session = createMockSession({
        id: "test-session",
        summary: "Test summary for session",
      });

      render(<SessionsList sessions={[session]} projectPath={defaultProjectPath} />);

      expect(screen.getByText("Test summary for session")).toBeInTheDocument();
    });

    it("handles sessions with firstPrompt instead of summary", () => {
      const session = createMockSession({
        id: "test-session",
        summary: null,
        firstPrompt: "Hello, how are you?",
      });

      render(<SessionsList sessions={[session]} projectPath={defaultProjectPath} />);

      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
    });
  });

  describe("Session click handling", () => {
    it("calls onResumeSession with correct sessionId and projectPath when session is clicked", () => {
      const onResumeSession = jest.fn();
      const session = createMockSession({
        id: "session-abc-123",
        summary: "Clickable session",
      });
      const projectPath = "/Users/test/my-awesome-project";

      render(
        <SessionsList
          sessions={[session]}
          projectPath={projectPath}
          onResumeSession={onResumeSession}
        />
      );

      const sessionRow = screen.getByTestId("session-row-session-abc-123");
      fireEvent.click(sessionRow);

      expect(onResumeSession).toHaveBeenCalledTimes(1);
      expect(onResumeSession).toHaveBeenCalledWith(
        "session-abc-123",
        "/Users/test/my-awesome-project"
      );
    });

    it("calls onResumeSession with the correct session when multiple sessions exist", () => {
      const onResumeSession = jest.fn();
      const sessions = [
        createMockSession({ id: "session-1", summary: "First" }),
        createMockSession({ id: "session-2", summary: "Second" }),
        createMockSession({ id: "session-3", summary: "Third" }),
      ];
      const projectPath = "/project/path";

      render(
        <SessionsList
          sessions={sessions}
          projectPath={projectPath}
          onResumeSession={onResumeSession}
        />
      );

      // Click the second session
      fireEvent.click(screen.getByTestId("session-row-session-2"));

      expect(onResumeSession).toHaveBeenCalledWith("session-2", "/project/path");
    });

    it("does not throw when session is clicked and onResumeSession is not provided", () => {
      const session = createMockSession({ id: "session-1", summary: "Test" });

      render(<SessionsList sessions={[session]} projectPath={defaultProjectPath} />);

      // This should not throw an error
      expect(() => {
        fireEvent.click(screen.getByTestId("session-row-session-1"));
      }).not.toThrow();
    });

    it("does nothing when onResumeSession is undefined and session is clicked", () => {
      const session = createMockSession({ id: "session-1", summary: "Test" });

      // Render without onResumeSession prop
      const { container } = render(
        <SessionsList sessions={[session]} projectPath={defaultProjectPath} />
      );

      // Click should be handled gracefully (no-op)
      const sessionRow = screen.getByTestId("session-row-session-1");
      fireEvent.click(sessionRow);

      // Component should still be in the DOM unchanged
      expect(container.querySelector('[data-testid="sessions-list"]')).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("passes isLoading=true to the session that matches loadingSessionId", () => {
      const sessions = [
        createMockSession({ id: "session-1", summary: "First" }),
        createMockSession({ id: "session-2", summary: "Second" }),
        createMockSession({ id: "session-3", summary: "Third" }),
      ];

      render(
        <SessionsList
          sessions={sessions}
          projectPath={defaultProjectPath}
          loadingSessionId="session-2"
        />
      );

      expect(screen.getByTestId("session-row-session-1")).toHaveAttribute("data-loading", "false");
      expect(screen.getByTestId("session-row-session-2")).toHaveAttribute("data-loading", "true");
      expect(screen.getByTestId("session-row-session-3")).toHaveAttribute("data-loading", "false");
    });

    it("passes isLoading=false to all sessions when loadingSessionId is null", () => {
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];

      render(
        <SessionsList
          sessions={sessions}
          projectPath={defaultProjectPath}
          loadingSessionId={null}
        />
      );

      expect(screen.getByTestId("session-row-session-1")).toHaveAttribute("data-loading", "false");
      expect(screen.getByTestId("session-row-session-2")).toHaveAttribute("data-loading", "false");
    });

    it("passes isLoading=false to all sessions when loadingSessionId is not provided", () => {
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];

      render(<SessionsList sessions={sessions} projectPath={defaultProjectPath} />);

      expect(screen.getByTestId("session-row-session-1")).toHaveAttribute("data-loading", "false");
      expect(screen.getByTestId("session-row-session-2")).toHaveAttribute("data-loading", "false");
    });

    it("passes isLoading=false when loadingSessionId does not match any session", () => {
      const sessions = [
        createMockSession({ id: "session-1" }),
        createMockSession({ id: "session-2" }),
      ];

      render(
        <SessionsList
          sessions={sessions}
          projectPath={defaultProjectPath}
          loadingSessionId="non-existent-session"
        />
      );

      expect(screen.getByTestId("session-row-session-1")).toHaveAttribute("data-loading", "false");
      expect(screen.getByTestId("session-row-session-2")).toHaveAttribute("data-loading", "false");
    });
  });
});
