/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import { ActivityMetricsCard } from "../ActivityMetricsCard";

describe("ActivityMetricsCard", () => {
  const defaultProps = {
    sessionCount: 10,
    messageCount: 500,
    toolCalls: null,
    avgSessionDuration: 3600000, // 1 hour
    avgMessagesPerSession: 50,
  };

  describe("Rendering", () => {
    it("renders the card title", () => {
      render(<ActivityMetricsCard {...defaultProps} />);

      expect(screen.getByText("Activity Metrics")).toBeInTheDocument();
    });

    it("renders the activity icon", () => {
      render(<ActivityMetricsCard {...defaultProps} />);

      const titleElement = screen.getByText("Activity Metrics").parentElement;
      expect(titleElement?.querySelector("svg")).toBeInTheDocument();
    });

    it("displays all metric labels", () => {
      render(<ActivityMetricsCard {...defaultProps} />);

      expect(screen.getByText("Sessions")).toBeInTheDocument();
      expect(screen.getByText("Messages")).toBeInTheDocument();
      expect(screen.getByText("Tool Calls")).toBeInTheDocument();
      expect(screen.getByText("Avg Session")).toBeInTheDocument();
      expect(screen.getByText("Avg Messages")).toBeInTheDocument();
    });
  });

  describe("Session count display", () => {
    it("displays session count correctly", () => {
      render(<ActivityMetricsCard {...defaultProps} sessionCount={42} />);

      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("formats large session counts with locale string", () => {
      render(<ActivityMetricsCard {...defaultProps} sessionCount={1234} />);

      expect(screen.getByText("1,234")).toBeInTheDocument();
    });

    it("handles zero sessions", () => {
      render(<ActivityMetricsCard {...defaultProps} sessionCount={0} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("Message count display", () => {
    it("displays message count correctly", () => {
      render(<ActivityMetricsCard {...defaultProps} messageCount={100} />);

      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("formats large message counts with locale string", () => {
      render(<ActivityMetricsCard {...defaultProps} messageCount={12345} />);

      expect(screen.getByText("12,345")).toBeInTheDocument();
    });
  });

  describe("Tool calls display", () => {
    it("shows dash for null tool calls", () => {
      render(<ActivityMetricsCard {...defaultProps} toolCalls={null} />);

      // Find the Tool Calls metric and verify it shows dash
      const toolCallsLabel = screen.getByText("Tool Calls");
      const metricDiv = toolCallsLabel.closest("div")?.parentElement;
      expect(metricDiv?.textContent).toContain("—");
    });

    it("shows formatted count when tool calls is provided", () => {
      render(<ActivityMetricsCard {...defaultProps} toolCalls={5678} />);

      expect(screen.getByText("5,678")).toBeInTheDocument();
    });

    it("handles zero tool calls", () => {
      render(<ActivityMetricsCard {...defaultProps} toolCalls={0} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("Average session duration display", () => {
    it("formats average session duration correctly", () => {
      render(<ActivityMetricsCard {...defaultProps} avgSessionDuration={5400000} />); // 1h 30m

      expect(screen.getByText("1h 30m")).toBeInTheDocument();
    });

    it("handles short average sessions", () => {
      render(<ActivityMetricsCard {...defaultProps} avgSessionDuration={1800000} />); // 30m

      expect(screen.getByText("30m")).toBeInTheDocument();
    });

    it("handles zero average session duration", () => {
      render(<ActivityMetricsCard {...defaultProps} avgSessionDuration={0} />);

      expect(screen.getByText("0m")).toBeInTheDocument();
    });
  });

  describe("Average messages per session display", () => {
    it("displays average messages per session with '/session' suffix", () => {
      render(<ActivityMetricsCard {...defaultProps} avgMessagesPerSession={75} />);

      expect(screen.getByText("75/session")).toBeInTheDocument();
    });

    it("rounds decimal values", () => {
      render(<ActivityMetricsCard {...defaultProps} avgMessagesPerSession={45.7} />);

      expect(screen.getByText("46/session")).toBeInTheDocument();
    });

    it("handles zero average messages", () => {
      render(<ActivityMetricsCard {...defaultProps} avgMessagesPerSession={0} />);

      expect(screen.getByText("0/session")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("renders with card styling", () => {
      const { container } = render(<ActivityMetricsCard {...defaultProps} />);

      const card = container.firstChild;
      expect(card).toHaveClass("h-full");
      expect(card).toHaveClass("flex");
      expect(card).toHaveClass("flex-col");
    });

    it("uses grid layout for metrics", () => {
      const { container } = render(<ActivityMetricsCard {...defaultProps} />);

      // Find the grid container
      const gridContainer = container.querySelector(".grid");
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass("grid-cols-2");
    });
  });

  describe("Icons", () => {
    it("renders icon for each metric", () => {
      const { container } = render(<ActivityMetricsCard {...defaultProps} />);

      // Each metric should have an icon in a rounded-md container
      const iconContainers = container.querySelectorAll(".rounded-md.bg-muted\\/50");
      expect(iconContainers.length).toBe(5); // 5 metrics
    });
  });
});
