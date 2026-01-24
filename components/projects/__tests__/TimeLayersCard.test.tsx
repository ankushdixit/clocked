/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import { TimeLayersCard } from "../TimeLayersCard";

describe("TimeLayersCard", () => {
  const defaultProps = {
    wallClockStart: "2024-01-01T10:00:00Z",
    wallClockEnd: "2024-01-15T15:30:00Z",
    sessionTime: 3600000, // 1 hour
    activeTime: null,
    humanTime: null,
    claudeTime: null,
  };

  describe("Rendering", () => {
    it("renders the card title", () => {
      render(<TimeLayersCard {...defaultProps} />);

      expect(screen.getByText("Time Layers")).toBeInTheDocument();
    });

    it("renders the clock icon", () => {
      render(<TimeLayersCard {...defaultProps} />);

      // The card should have an icon (Clock from lucide-react)
      const card = screen.getByText("Time Layers").parentElement;
      expect(card?.querySelector("svg")).toBeInTheDocument();
    });

    it("displays all time layer labels", () => {
      render(<TimeLayersCard {...defaultProps} />);

      expect(screen.getByText("Wall Clock")).toBeInTheDocument();
      expect(screen.getByText("Session Time")).toBeInTheDocument();
      expect(screen.getByText("Active Time")).toBeInTheDocument();
      expect(screen.getByText("Human")).toBeInTheDocument();
      expect(screen.getByText("Claude")).toBeInTheDocument();
    });
  });

  describe("Wall Clock Time display", () => {
    it("formats wall clock range correctly", () => {
      render(<TimeLayersCard {...defaultProps} />);

      // Should show date range in format "Jan 1 -> Jan 15"
      expect(screen.getByText(/Jan 1.*→.*Jan 15/)).toBeInTheDocument();
    });

    it("handles same-day wall clock range", () => {
      render(
        <TimeLayersCard
          {...defaultProps}
          wallClockStart="2024-01-15T10:00:00Z"
          wallClockEnd="2024-01-15T18:00:00Z"
        />
      );

      expect(screen.getByText(/Jan 15.*→.*Jan 15/)).toBeInTheDocument();
    });
  });

  describe("Session Time display", () => {
    it("formats session time in hours and minutes", () => {
      render(<TimeLayersCard {...defaultProps} sessionTime={5400000} />); // 1h 30m

      expect(screen.getByText("1h 30m")).toBeInTheDocument();
    });

    it("displays zero minutes for short durations", () => {
      render(<TimeLayersCard {...defaultProps} sessionTime={0} />);

      expect(screen.getByText("0m")).toBeInTheDocument();
    });

    it("handles large session times", () => {
      render(<TimeLayersCard {...defaultProps} sessionTime={360000000} />); // 100 hours

      expect(screen.getByText("100h 0m")).toBeInTheDocument();
    });
  });

  describe("Placeholder values", () => {
    it("shows dash for null activeTime", () => {
      render(<TimeLayersCard {...defaultProps} activeTime={null} />);

      // Find the Active Time row and check its value
      const activeTimeLabel = screen.getByText("Active Time");
      const activeTimeRow = activeTimeLabel.closest("div");
      expect(activeTimeRow?.parentElement).toHaveTextContent("—");
    });

    it("shows dash for null humanTime", () => {
      render(<TimeLayersCard {...defaultProps} humanTime={null} />);

      const humanLabel = screen.getByText("Human");
      const humanRow = humanLabel.closest("div");
      expect(humanRow?.parentElement).toHaveTextContent("—");
    });

    it("shows dash for null claudeTime", () => {
      render(<TimeLayersCard {...defaultProps} claudeTime={null} />);

      const claudeLabel = screen.getByText("Claude");
      const claudeRow = claudeLabel.closest("div");
      expect(claudeRow?.parentElement).toHaveTextContent("—");
    });

    it("shows formatted time when activeTime is provided", () => {
      render(<TimeLayersCard {...defaultProps} activeTime={7200000} />); // 2 hours

      expect(screen.getByText("2h 0m")).toBeInTheDocument();
    });

    it("shows formatted time when humanTime is provided", () => {
      render(<TimeLayersCard {...defaultProps} humanTime={5400000} />); // 1h 30m

      expect(screen.getByText("1h 30m")).toBeInTheDocument();
    });

    it("shows formatted time when claudeTime is provided", () => {
      render(<TimeLayersCard {...defaultProps} claudeTime={1800000} />); // 30m

      expect(screen.getByText("30m")).toBeInTheDocument();
    });
  });

  describe("Indentation", () => {
    it("renders Human and Claude rows with indent markers", () => {
      render(<TimeLayersCard {...defaultProps} />);

      // Check for the indent marker character
      const humanRow = screen.getByText("Human").closest("div");
      expect(humanRow?.textContent).toContain("└");

      const claudeRow = screen.getByText("Claude").closest("div");
      expect(claudeRow?.textContent).toContain("└");
    });
  });

  describe("Styling", () => {
    it("renders with card styling", () => {
      const { container } = render(<TimeLayersCard {...defaultProps} />);

      // Check for card classes
      const card = container.firstChild;
      expect(card).toHaveClass("h-full");
      expect(card).toHaveClass("flex");
      expect(card).toHaveClass("flex-col");
    });

    it("applies tabular-nums class for time values", () => {
      render(<TimeLayersCard {...defaultProps} />);

      // Time values should have tabular-nums for proper alignment
      const sessionTimeValue = screen.getByText("1h 0m");
      expect(sessionTimeValue).toHaveClass("tabular-nums");
    });
  });
});
