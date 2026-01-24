/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import { ProjectQuickStatsCard } from "../ProjectQuickStatsCard";

const defaultProps = {
  toolCalls: 1245,
  busiestDay: { date: "Jan 15", sessions: 8 },
  longestSession: { duration: 2 * 60 * 60 * 1000, date: "Jan 12" }, // 2 hours
  avgSessionDuration: 45 * 60 * 1000, // 45 minutes
};

describe("ProjectQuickStatsCard", () => {
  describe("Rendering", () => {
    it("renders the card title", () => {
      render(<ProjectQuickStatsCard {...defaultProps} />);
      expect(screen.getByText("Quick Stats")).toBeInTheDocument();
    });

    it("renders all four stat items", () => {
      render(<ProjectQuickStatsCard {...defaultProps} />);
      expect(screen.getByText("Tool Calls")).toBeInTheDocument();
      expect(screen.getByText("Busiest Day")).toBeInTheDocument();
      expect(screen.getByText("Longest Session")).toBeInTheDocument();
      expect(screen.getByText("Avg Duration")).toBeInTheDocument();
    });

    it("displays tool calls count formatted", () => {
      render(<ProjectQuickStatsCard {...defaultProps} />);
      expect(screen.getByText("1,245")).toBeInTheDocument();
    });

    it("displays busiest day date and sessions", () => {
      render(<ProjectQuickStatsCard {...defaultProps} />);
      expect(screen.getByText("Jan 15")).toBeInTheDocument();
      expect(screen.getByText("8 sessions")).toBeInTheDocument();
    });

    it("displays longest session duration formatted", () => {
      render(<ProjectQuickStatsCard {...defaultProps} />);
      expect(screen.getByText("2h 0m")).toBeInTheDocument();
      expect(screen.getByText("Jan 12")).toBeInTheDocument();
    });

    it("displays average session duration formatted", () => {
      render(<ProjectQuickStatsCard {...defaultProps} />);
      expect(screen.getByText("45m")).toBeInTheDocument();
      expect(screen.getByText("per session")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("renders with card styling", () => {
      const { container } = render(<ProjectQuickStatsCard {...defaultProps} />);
      const card = container.firstChild;
      expect(card).toHaveClass("h-full");
      expect(card).toHaveClass("flex");
      expect(card).toHaveClass("flex-col");
    });

    it("has data-testid attribute", () => {
      render(<ProjectQuickStatsCard {...defaultProps} />);
      expect(screen.getByTestId("quick-stats-card")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles zero tool calls", () => {
      render(<ProjectQuickStatsCard {...defaultProps} toolCalls={0} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles zero average session duration", () => {
      render(<ProjectQuickStatsCard {...defaultProps} avgSessionDuration={0} />);
      expect(screen.getByText("0m")).toBeInTheDocument();
    });

    it("handles single session on busiest day", () => {
      render(
        <ProjectQuickStatsCard {...defaultProps} busiestDay={{ date: "Jan 1", sessions: 1 }} />
      );
      expect(screen.getByText("1 sessions")).toBeInTheDocument();
    });
  });
});
