/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import { SessionsList } from "../SessionsList";
import type { Session } from "@/types/electron";

// Mock the SessionRow component
jest.mock("../SessionRow", () => ({
  SessionRow: ({ session }: { session: Session }) => (
    <div data-testid={`session-row-${session.id}`}>{session.summary || session.firstPrompt}</div>
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

describe("SessionsList", () => {
  describe("Rendering", () => {
    it("renders all sessions", () => {
      const sessions = [
        createMockSession({ id: "session-1", summary: "First session" }),
        createMockSession({ id: "session-2", summary: "Second session" }),
        createMockSession({ id: "session-3", summary: "Third session" }),
      ];

      render(<SessionsList sessions={sessions} />);

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

      render(<SessionsList sessions={sessions} />);

      const rows = screen.getAllByTestId(/session-row-/);
      expect(rows[0]).toHaveTextContent("A");
      expect(rows[1]).toHaveTextContent("B");
      expect(rows[2]).toHaveTextContent("C");
    });

    it("renders empty list when no sessions provided", () => {
      const { container } = render(<SessionsList sessions={[]} />);

      // The container should be empty except for the wrapper div
      expect(container.querySelectorAll('[data-testid^="session-row-"]').length).toBe(0);
    });

    it("uses session id as key for each row", () => {
      const sessions = [
        createMockSession({ id: "unique-id-1" }),
        createMockSession({ id: "unique-id-2" }),
      ];

      render(<SessionsList sessions={sessions} />);

      expect(screen.getByTestId("session-row-unique-id-1")).toBeInTheDocument();
      expect(screen.getByTestId("session-row-unique-id-2")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies space-y-2 for vertical spacing between sessions", () => {
      const sessions = [createMockSession({ id: "session-1" })];

      const { container } = render(<SessionsList sessions={sessions} />);

      expect(container.firstChild).toHaveClass("space-y-2");
    });
  });

  describe("Session data passing", () => {
    it("passes session data to SessionRow component", () => {
      const session = createMockSession({
        id: "test-session",
        summary: "Test summary for session",
      });

      render(<SessionsList sessions={[session]} />);

      expect(screen.getByText("Test summary for session")).toBeInTheDocument();
    });

    it("handles sessions with firstPrompt instead of summary", () => {
      const session = createMockSession({
        id: "test-session",
        summary: null,
        firstPrompt: "Hello, how are you?",
      });

      render(<SessionsList sessions={[session]} />);

      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
    });
  });
});
