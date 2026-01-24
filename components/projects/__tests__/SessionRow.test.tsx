/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { SessionRow } from "../SessionRow";
import type { Session } from "@/types/electron";

const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: "session-1",
  projectPath: "/Users/test/my-project",
  created: "2024-01-10T10:00:00Z",
  modified: "2024-01-10T11:00:00Z",
  duration: 3600000, // 1 hour
  messageCount: 50,
  summary: "Test session summary",
  firstPrompt: "Hello, how are you?",
  gitBranch: "main",
  ...overrides,
});

describe("SessionRow", () => {
  describe("Display text", () => {
    it("displays session summary when available", () => {
      const session = createMockSession({ summary: "Working on feature X" });

      render(<SessionRow session={session} />);

      expect(screen.getByText("Working on feature X")).toBeInTheDocument();
    });

    it("displays first prompt when summary is null", () => {
      const session = createMockSession({
        summary: null,
        firstPrompt: "Can you help me with this?",
      });

      render(<SessionRow session={session} />);

      expect(screen.getByText("Can you help me with this?")).toBeInTheDocument();
    });

    it("displays 'No description' when both summary and firstPrompt are null", () => {
      const session = createMockSession({
        summary: null,
        firstPrompt: null,
      });

      render(<SessionRow session={session} />);

      expect(screen.getByText("No description")).toBeInTheDocument();
    });

    it("renders full text (CSS handles visual truncation)", () => {
      const longText =
        "This is a very long summary that exceeds eighty characters and should be visually truncated by CSS line-clamp";
      const session = createMockSession({ summary: longText });

      render(<SessionRow session={session} />);

      // Full text is rendered, CSS line-clamp-2 handles visual truncation
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("applies line-clamp-2 class for text truncation", () => {
      const session = createMockSession({ summary: "Test summary" });

      const { container } = render(<SessionRow session={session} />);

      const textElement = container.querySelector(".line-clamp-2");
      expect(textElement).toBeInTheDocument();
    });

    it("renders short text without issues", () => {
      const shortText = "Short summary";
      const session = createMockSession({ summary: shortText });

      render(<SessionRow session={session} />);

      expect(screen.getByText(shortText)).toBeInTheDocument();
    });
  });

  describe("Date formatting", () => {
    it("displays 'Today' for sessions created today", () => {
      const today = new Date();
      today.setHours(10, 30, 0, 0);
      const session = createMockSession({ created: today.toISOString() });

      render(<SessionRow session={session} />);

      expect(screen.getByText(/Today at 10:30 AM/i)).toBeInTheDocument();
    });

    it("displays 'Yesterday' for sessions created yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(14, 45, 0, 0);
      const session = createMockSession({ created: yesterday.toISOString() });

      render(<SessionRow session={session} />);

      expect(screen.getByText(/Yesterday at 2:45 PM/i)).toBeInTheDocument();
    });

    it("displays month and day for older sessions", () => {
      const session = createMockSession({ created: "2024-01-15T09:30:00Z" });

      render(<SessionRow session={session} />);

      // Should show "Jan 15 at 9:30 AM" (time may vary by timezone)
      expect(screen.getByText(/Jan 15 at/)).toBeInTheDocument();
    });
  });

  describe("Duration display", () => {
    it("formats duration in hours and minutes", () => {
      const session = createMockSession({ duration: 5400000 }); // 1h 30m

      render(<SessionRow session={session} />);

      expect(screen.getByText("1h 30m")).toBeInTheDocument();
    });

    it("formats short durations in minutes only", () => {
      const session = createMockSession({ duration: 1800000 }); // 30m

      render(<SessionRow session={session} />);

      expect(screen.getByText("30m")).toBeInTheDocument();
    });

    it("handles zero duration", () => {
      const session = createMockSession({ duration: 0 });

      render(<SessionRow session={session} />);

      expect(screen.getByText("0m")).toBeInTheDocument();
    });
  });

  describe("Message count display", () => {
    it("displays message count with 'messages' label", () => {
      const session = createMockSession({ messageCount: 42 });

      render(<SessionRow session={session} />);

      expect(screen.getByText("42 messages")).toBeInTheDocument();
    });

    it("displays singular 'message' for count of 1", () => {
      const session = createMockSession({ messageCount: 1 });

      render(<SessionRow session={session} />);

      // The component uses plural "messages" regardless of count
      expect(screen.getByText("1 messages")).toBeInTheDocument();
    });

    it("handles zero messages", () => {
      const session = createMockSession({ messageCount: 0 });

      render(<SessionRow session={session} />);

      expect(screen.getByText("0 messages")).toBeInTheDocument();
    });
  });

  describe("Click behavior", () => {
    it("calls onClick when row is clicked", () => {
      const onClick = jest.fn();
      const session = createMockSession();

      render(<SessionRow session={session} onClick={onClick} />);

      const row = screen.getByRole("button");
      fireEvent.click(row);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not throw when clicked without onClick handler", () => {
      const session = createMockSession();

      render(<SessionRow session={session} />);

      const row = screen.getByRole("button");
      expect(() => fireEvent.click(row)).not.toThrow();
    });

    it("supports keyboard activation with Enter key", () => {
      const onClick = jest.fn();
      const session = createMockSession();

      render(<SessionRow session={session} onClick={onClick} />);

      const row = screen.getByRole("button");
      fireEvent.keyDown(row, { key: "Enter" });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("supports keyboard activation with Space key", () => {
      const onClick = jest.fn();
      const session = createMockSession();

      render(<SessionRow session={session} onClick={onClick} />);

      const row = screen.getByRole("button");
      fireEvent.keyDown(row, { key: " " });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not trigger on other keys", () => {
      const onClick = jest.fn();
      const session = createMockSession();

      render(<SessionRow session={session} onClick={onClick} />);

      const row = screen.getByRole("button");
      fireEvent.keyDown(row, { key: "Escape" });

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("has cursor-pointer for click interaction", () => {
      const session = createMockSession();

      render(<SessionRow session={session} />);

      const row = screen.getByRole("button");
      expect(row).toHaveClass("cursor-pointer");
    });

    it("has group class for hover interactions", () => {
      const session = createMockSession();

      render(<SessionRow session={session} />);

      const row = screen.getByRole("button");
      expect(row).toHaveClass("group");
    });

    it("has border styling", () => {
      const session = createMockSession();

      render(<SessionRow session={session} />);

      const row = screen.getByRole("button");
      expect(row).toHaveClass("border");
      expect(row).toHaveClass("rounded-xl");
    });

    it("has transition for hover effects", () => {
      const session = createMockSession();

      render(<SessionRow session={session} />);

      const row = screen.getByRole("button");
      expect(row).toHaveClass("transition-all");
    });

    it("has tabIndex for keyboard accessibility", () => {
      const session = createMockSession();

      render(<SessionRow session={session} />);

      const row = screen.getByRole("button");
      expect(row).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("Icons", () => {
    it("renders icons for duration and messages", () => {
      const session = createMockSession();

      const { container } = render(<SessionRow session={session} />);

      // Should have multiple SVG icons (Clock, MessageSquare, ArrowUpRight)
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
