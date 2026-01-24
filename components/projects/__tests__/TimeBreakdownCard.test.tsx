/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import { TimeBreakdownCard } from "../TimeBreakdownCard";

const defaultProps = {
  clockStart: "2024-01-01T10:00:00Z",
  clockEnd: "2024-01-15T15:30:00Z",
  rawSessionTime: 76 * 60 * 60 * 1000, // 76 hours
  filteredSessionTime: 10224000, // ~2h 50m
  humanTime: 6550000, // ~1h 49m
  aiTime: 3674000, // ~1h 1m
};

describe("TimeBreakdownCard", () => {
  describe("Rendering", () => {
    it("renders the card title", () => {
      render(<TimeBreakdownCard {...defaultProps} />);
      expect(screen.getByText("Time Breakdown")).toBeInTheDocument();
    });

    it("renders clock time layer", () => {
      render(<TimeBreakdownCard {...defaultProps} />);
      expect(screen.getByText("Clock Time")).toBeInTheDocument();
    });

    it("renders session time layer", () => {
      render(<TimeBreakdownCard {...defaultProps} />);
      expect(screen.getByText("Session Time")).toBeInTheDocument();
    });

    it("renders active time layer", () => {
      render(<TimeBreakdownCard {...defaultProps} />);
      expect(screen.getByText("Active Time")).toBeInTheDocument();
    });

    it("renders human vs claude split legend", () => {
      render(<TimeBreakdownCard {...defaultProps} />);
      // Legend shows Human and Claude percentages
      expect(screen.getByText(/Human \d+%/)).toBeInTheDocument();
      expect(screen.getByText(/Claude \d+%/)).toBeInTheDocument();
    });
  });

  describe("Legend", () => {
    it("calculates correct human percentage in legend", () => {
      render(<TimeBreakdownCard {...defaultProps} />);
      // humanTime / (humanTime + aiTime) = 6550000 / 10224000 ≈ 64%
      expect(screen.getByText(/Human 64%/)).toBeInTheDocument();
    });

    it("calculates correct claude percentage in legend", () => {
      render(<TimeBreakdownCard {...defaultProps} />);
      // aiTime / (humanTime + aiTime) = 3674000 / 10224000 ≈ 36%
      expect(screen.getByText(/Claude 36%/)).toBeInTheDocument();
    });
  });

  describe("Clock Time Formatting", () => {
    it("shows days for long time spans", () => {
      render(<TimeBreakdownCard {...defaultProps} />);
      // 14+ days span
      expect(screen.getByText("15 days")).toBeInTheDocument();
    });

    it("shows hours for short time spans", () => {
      const shortSpanProps = {
        ...defaultProps,
        clockStart: "2024-01-01T10:00:00Z",
        clockEnd: "2024-01-01T18:00:00Z", // 8 hours
      };
      render(<TimeBreakdownCard {...shortSpanProps} />);
      expect(screen.getByText("8h 0m")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles zero times gracefully", () => {
      const zeroProps = {
        ...defaultProps,
        rawSessionTime: 0,
        filteredSessionTime: 0,
        humanTime: 0,
        aiTime: 0,
      };
      render(<TimeBreakdownCard {...zeroProps} />);
      expect(screen.getByText("Time Breakdown")).toBeInTheDocument();
    });

    it("renders with equal human and AI time", () => {
      const equalProps = {
        ...defaultProps,
        humanTime: 5000000,
        aiTime: 5000000,
      };
      render(<TimeBreakdownCard {...equalProps} />);
      expect(screen.getByText(/Human 50%/)).toBeInTheDocument();
      expect(screen.getByText(/Claude 50%/)).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading skeleton when isLoading is true", () => {
      render(<TimeBreakdownCard {...defaultProps} isLoading={true} />);
      // Clock Time and Session Time should still be visible
      expect(screen.getByText("Clock Time")).toBeInTheDocument();
      expect(screen.getByText("Session Time")).toBeInTheDocument();
      // Active Time should not be visible
      expect(screen.queryByText("Active Time")).not.toBeInTheDocument();
      // Loading message should be shown
      expect(screen.getByText("Calculating time split...")).toBeInTheDocument();
    });

    it("shows full content when isLoading is false", () => {
      render(<TimeBreakdownCard {...defaultProps} isLoading={false} />);
      expect(screen.getByText("Active Time")).toBeInTheDocument();
      expect(screen.getByText(/Human \d+%/)).toBeInTheDocument();
      expect(screen.queryByText("Calculating time split...")).not.toBeInTheDocument();
    });

    it("defaults to not loading when isLoading is not provided", () => {
      render(<TimeBreakdownCard {...defaultProps} />);
      expect(screen.getByText("Active Time")).toBeInTheDocument();
      expect(screen.queryByText("Calculating time split...")).not.toBeInTheDocument();
    });
  });
});
